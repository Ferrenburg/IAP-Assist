import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "jsr:@supabase/supabase-js@2.49.8";
import * as kv from "./kv_store.tsx";

const app = new Hono();

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Helper to create Supabase client with request context
const getSupabaseClient = (req?: Request, serviceRole = false) => {
  if (serviceRole) {
    return createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );
  }

  // If request is provided, use its auth header for user context
  if (req) {
    const authHeader = req.headers.get('Authorization') ?? '';
    return createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      {
        global: {
          headers: {
            Authorization: authHeader,
          },
        },
      }
    );
  }

  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!
  );
};

// Helper to get authenticated user with retry logic
const getAuthenticatedUser = async (req: Request) => {
  const authHeader = req.headers.get('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log('No valid authorization header:', authHeader);
    return null;
  }

  const token = authHeader.replace('Bearer ', '');
  console.log('Validating token:', token.substring(0, 30) + '...');

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!
  );

  // Retry logic for network errors
  let lastError = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const { data: { user }, error } = await supabase.auth.getUser(token);

      if (error) {
        console.log('Auth validation failed:', error.message);
        return null;
      }

      if (!user) {
        console.log('No user found for token');
        return null;
      }

      console.log('Authenticated user ID:', user.id);
      return user;
    } catch (err: any) {
      lastError = err;
      console.log(`Auth attempt ${attempt + 1} failed:`, err.message);

      // Only retry on network errors
      if (err.message?.includes('connection') || err.message?.includes('network') || err.message?.includes('reset')) {
        if (attempt < 2) {
          // Wait before retrying (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 100));
          continue;
        }
      }

      // Non-retryable error or max retries reached
      break;
    }
  }

  console.log('Auth failed after retries:', lastError?.message);
  return null;
};

// Helper to check if user is admin
const isAdmin = (user: any): boolean => {
  if (!user) {
    console.log('isAdmin check: no user');
    return false;
  }
  const isSam = user.email === 'sam@ferrenburg.com';
  const hasAdminFlag = user.user_metadata?.isAdmin === true;
  console.log(`isAdmin check for ${user.email}: isSam=${isSam}, hasAdminFlag=${hasAdminFlag}`);
  return isSam || hasAdminFlag;
};

// Health check endpoint
app.get("/make-server-897e0759/health", (c) => {
  return c.json({ status: "ok" });
});

// ===== AUTHENTICATION ROUTES =====

app.post("/make-server-897e0759/auth/signup", async (c) => {
  try {
    const body = await c.req.json();
    const { email, password, name } = body;

    if (!email || !password) {
      return c.json({ error: "Email and password are required" }, 400);
    }

    const supabase = getSupabaseClient(undefined, true);
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { name: name || email.split('@')[0] },
      email_confirm: true, // Auto-confirm since email server isn't configured
    });

    if (error) {
      console.log(`Signup error for ${email}: ${error.message}`);
      return c.json({ error: error.message }, 400);
    }

    return c.json({ user: data.user });
  } catch (error) {
    console.log(`Signup server error: ${error}`);
    return c.json({ error: "Failed to create user" }, 500);
  }
});

app.post("/make-server-897e0759/auth/login", async (c) => {
  try {
    const body = await c.req.json();
    const { email, password } = body;

    if (!email || !password) {
      return c.json({ error: "Email and password are required" }, 400);
    }

    const supabase = getSupabaseClient(c.req.raw);
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.log(`Login error for ${email}: ${error.message}`);
      return c.json({ error: error.message }, 400);
    }

    return c.json({
      user: data.user,
      session: data.session,
    });
  } catch (error) {
    console.log(`Login server error: ${error}`);
    return c.json({ error: "Failed to sign in" }, 500);
  }
});

app.post("/make-server-897e0759/auth/logout", async (c) => {
  try {
    const supabase = getSupabaseClient(c.req.raw);
    await supabase.auth.signOut();

    return c.json({ success: true });
  } catch (error) {
    console.log(`Logout error: ${error}`);
    return c.json({ error: "Failed to sign out" }, 500);
  }
});

app.get("/make-server-897e0759/auth/session", async (c) => {
  try {
    const user = await getAuthenticatedUser(c.req.raw);

    if (!user) {
      return c.json({ user: null }, 401);
    }

    return c.json({ user });
  } catch (error) {
    console.log(`Session check error: ${error}`);
    return c.json({ user: null }, 500);
  }
});

// ===== IAP WORKSPACE ROUTES =====

app.get("/make-server-897e0759/iaps", async (c) => {
  try {
    const user = await getAuthenticatedUser(c.req.raw);

    if (!user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const iaps = await kv.getByPrefix(`iap:${user.id}:`);
    return c.json({ iaps: iaps || [] });
  } catch (error) {
    console.log(`Error fetching IAPs: ${error}`);
    return c.json({ error: "Failed to fetch IAPs" }, 500);
  }
});

app.get("/make-server-897e0759/iaps/:iapId", async (c) => {
  try {
    const user = await getAuthenticatedUser(c.req.raw);

    if (!user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const iapId = c.req.param("iapId");
    const iap = await kv.get(`iap:${user.id}:${iapId}`);

    if (!iap) {
      return c.json({ error: "IAP not found" }, 404);
    }

    return c.json({ iap });
  } catch (error) {
    console.log(`Error fetching IAP: ${error}`);
    return c.json({ error: "Failed to fetch IAP" }, 500);
  }
});

app.post("/make-server-897e0759/iaps", async (c) => {
  try {
    const user = await getAuthenticatedUser(c.req.raw);

    if (!user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const body = await c.req.json();
    const iapId = crypto.randomUUID();

    const iap = {
      id: iapId,
      userId: user.id,
      name: body.name,
      incidentNumber: body.incidentNumber,
      jurisdiction: body.jurisdiction,
      incidentCommander: body.incidentCommander,
      incidentType: body.incidentType || 'Wildfire',
      location: body.location || '',
      startDate: body.startDate,
      startTime: body.startTime,
      description: body.description || '',
      status: 'draft',
      currentOP: 'OP 1',
      completionPercent: 0,
      periods: [], // Initialize empty periods array
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await kv.set(`iap:${user.id}:${iapId}`, iap);
    console.log(`Created IAP ${iapId} with empty periods array`);

    return c.json({ iap });
  } catch (error) {
    console.log(`Error creating IAP: ${error}`);
    return c.json({ error: "Failed to create IAP" }, 500);
  }
});

app.put("/make-server-897e0759/iaps/:iapId", async (c) => {
  try {
    const user = await getAuthenticatedUser(c.req.raw);

    if (!user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const iapId = c.req.param("iapId");
    const body = await c.req.json();

    const existingIap = await kv.get(`iap:${user.id}:${iapId}`);

    if (!existingIap) {
      return c.json({ error: "IAP not found" }, 404);
    }

    const updatedIap = {
      ...existingIap,
      ...body,
      updatedAt: new Date().toISOString(),
    };

    await kv.set(`iap:${user.id}:${iapId}`, updatedIap);

    return c.json({ iap: updatedIap });
  } catch (error) {
    console.log(`Error updating IAP: ${error}`);
    return c.json({ error: "Failed to update IAP" }, 500);
  }
});

app.delete("/make-server-897e0759/iaps/:iapId", async (c) => {
  try {
    const user = await getAuthenticatedUser(c.req.raw);

    if (!user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const iapId = c.req.param("iapId");
    await kv.del(`iap:${user.id}:${iapId}`);

    return c.json({ success: true });
  } catch (error) {
    console.log(`Error deleting IAP: ${error}`);
    return c.json({ error: "Failed to delete IAP" }, 500);
  }
});

// ===== OPERATIONAL PERIODS ROUTES =====
// Store periods as an array directly on the IAP

app.get("/make-server-897e0759/iaps/:iapId/periods", async (c) => {
  try {
    const user = await getAuthenticatedUser(c.req.raw);

    if (!user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const iapId = c.req.param("iapId");

    // Get the IAP
    const iap = await kv.get(`iap:${user.id}:${iapId}`);

    if (!iap) {
      return c.json({ error: "IAP not found" }, 404);
    }

    const periods = iap.periods || [];
    console.log(`Fetching periods for IAP ${iapId}, found ${periods.length} periods`);

    return c.json({ data: periods });
  } catch (error) {
    console.log(`Error fetching periods: ${error}`);
    return c.json({ error: "Failed to fetch periods" }, 500);
  }
});

app.post("/make-server-897e0759/iaps/:iapId/periods", async (c) => {
  try {
    const user = await getAuthenticatedUser(c.req.raw);

    if (!user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const iapId = c.req.param("iapId");
    const body = await c.req.json();

    // Get the IAP
    const iap = await kv.get(`iap:${user.id}:${iapId}`);

    if (!iap) {
      return c.json({ error: "IAP not found" }, 404);
    }

    // Use provided ID or generate new one
    const periodId = body.id || crypto.randomUUID();

    const period = {
      ...body,
      id: periodId,
      iapId,
      createdAt: new Date().toISOString(),
    };

    // Add period to IAP's periods array
    const periods = iap.periods || [];
    periods.push(period);

    // Update IAP with new periods array
    const updatedIap = {
      ...iap,
      periods,
      updatedAt: new Date().toISOString(),
    };

    await kv.set(`iap:${user.id}:${iapId}`, updatedIap);
    console.log(`Created period ${periodId} for IAP ${iapId}, total periods: ${periods.length}`);

    return c.json({ item: period });
  } catch (error) {
    console.log(`Error creating period: ${error}`);
    return c.json({ error: "Failed to create period" }, 500);
  }
});

app.put("/make-server-897e0759/iaps/:iapId/periods/:periodId", async (c) => {
  try {
    const user = await getAuthenticatedUser(c.req.raw);

    if (!user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const iapId = c.req.param("iapId");
    const periodId = c.req.param("periodId");
    const body = await c.req.json();

    // Get the IAP
    const iap = await kv.get(`iap:${user.id}:${iapId}`);

    if (!iap) {
      return c.json({ error: "IAP not found" }, 404);
    }

    // Find and update the period in the periods array
    const periods = iap.periods || [];
    const periodIndex = periods.findIndex((p: any) => p.id === periodId);

    if (periodIndex === -1) {
      return c.json({ error: "Period not found" }, 404);
    }

    // Update the period while preserving createdAt
    const updatedPeriod = {
      ...periods[periodIndex],
      ...body,
      id: periodId, // Ensure ID doesn't change
      iapId,
      updatedAt: new Date().toISOString(),
    };

    periods[periodIndex] = updatedPeriod;

    // Update IAP with modified periods array
    const updatedIap = {
      ...iap,
      periods,
      updatedAt: new Date().toISOString(),
    };

    await kv.set(`iap:${user.id}:${iapId}`, updatedIap);
    console.log(`Updated period ${periodId} for IAP ${iapId}`);

    return c.json({ item: updatedPeriod });
  } catch (error) {
    console.log(`Error updating period: ${error}`);
    return c.json({ error: "Failed to update period" }, 500);
  }
});

app.delete("/make-server-897e0759/iaps/:iapId/periods/:periodId", async (c) => {
  try {
    const user = await getAuthenticatedUser(c.req.raw);

    if (!user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const iapId = c.req.param("iapId");
    const periodId = c.req.param("periodId");

    // Get the IAP
    const iap = await kv.get(`iap:${user.id}:${iapId}`);

    if (!iap) {
      return c.json({ error: "IAP not found" }, 404);
    }

    // Remove the period from the periods array
    const periods = iap.periods || [];
    const filteredPeriods = periods.filter((p: any) => p.id !== periodId);

    if (filteredPeriods.length === periods.length) {
      return c.json({ error: "Period not found" }, 404);
    }

    // Update IAP with filtered periods array
    const updatedIap = {
      ...iap,
      periods: filteredPeriods,
      updatedAt: new Date().toISOString(),
    };

    await kv.set(`iap:${user.id}:${iapId}`, updatedIap);
    console.log(`Deleted period ${periodId} from IAP ${iapId}, remaining periods: ${filteredPeriods.length}`);

    return c.json({ success: true });
  } catch (error) {
    console.log(`Error deleting period: ${error}`);
    return c.json({ error: "Failed to delete period" }, 500);
  }
});

// ===== OBJECTIVES ROUTES =====

app.get("/make-server-897e0759/iaps/:iapId/objectives", async (c) => {
  try {
    const user = await getAuthenticatedUser(c.req.raw);

    if (!user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const iapId = c.req.param("iapId");
    const objectives = await kv.getByPrefix(`objective:${user.id}:${iapId}:`);

    return c.json({ objectives: objectives || [] });
  } catch (error) {
    console.log(`Error fetching objectives: ${error}`);
    return c.json({ error: "Failed to fetch objectives" }, 500);
  }
});

app.post("/make-server-897e0759/iaps/:iapId/objectives", async (c) => {
  try {
    const user = await getAuthenticatedUser(c.req.raw);

    if (!user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const iapId = c.req.param("iapId");
    const body = await c.req.json();
    const objectiveId = crypto.randomUUID();

    const objective = {
      id: objectiveId,
      iapId,
      ...body,
      createdAt: new Date().toISOString(),
    };

    await kv.set(`objective:${user.id}:${iapId}:${objectiveId}`, objective);

    return c.json({ objective });
  } catch (error) {
    console.log(`Error creating objective: ${error}`);
    return c.json({ error: "Failed to create objective" }, 500);
  }
});

app.put("/make-server-897e0759/iaps/:iapId/objectives/:objectiveId", async (c) => {
  try {
    const user = await getAuthenticatedUser(c.req.raw);

    if (!user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const iapId = c.req.param("iapId");
    const objectiveId = c.req.param("objectiveId");
    const body = await c.req.json();

    const existing = await kv.get(`objective:${user.id}:${iapId}:${objectiveId}`);
    if (!existing) {
      return c.json({ error: "Objective not found" }, 404);
    }

    const objective = {
      ...existing,
      ...body,
      updatedAt: new Date().toISOString(),
    };

    await kv.set(`objective:${user.id}:${iapId}:${objectiveId}`, objective);

    return c.json({ objective });
  } catch (error) {
    console.log(`Error updating objective: ${error}`);
    return c.json({ error: "Failed to update objective" }, 500);
  }
});

app.delete("/make-server-897e0759/iaps/:iapId/objectives/:objectiveId", async (c) => {
  try {
    const user = await getAuthenticatedUser(c.req.raw);

    if (!user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const iapId = c.req.param("iapId");
    const objectiveId = c.req.param("objectiveId");

    await kv.del(`objective:${user.id}:${iapId}:${objectiveId}`);

    return c.json({ success: true });
  } catch (error) {
    console.log(`Error deleting objective: ${error}`);
    return c.json({ error: "Failed to delete objective" }, 500);
  }
});

// ===== CONTACTS ROUTES =====

app.get("/make-server-897e0759/iaps/:iapId/contacts", async (c) => {
  try {
    const user = await getAuthenticatedUser(c.req.raw);

    if (!user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const iapId = c.req.param("iapId");
    const contacts = await kv.getByPrefix(`contact:${user.id}:${iapId}:`);

    return c.json({ contacts: contacts || [] });
  } catch (error) {
    console.log(`Error fetching contacts: ${error}`);
    return c.json({ error: "Failed to fetch contacts" }, 500);
  }
});

app.post("/make-server-897e0759/iaps/:iapId/contacts", async (c) => {
  try {
    const user = await getAuthenticatedUser(c.req.raw);

    if (!user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const iapId = c.req.param("iapId");
    const body = await c.req.json();
    const contactId = crypto.randomUUID();

    const contact = {
      id: contactId,
      iapId,
      ...body,
      createdAt: new Date().toISOString(),
    };

    await kv.set(`contact:${user.id}:${iapId}:${contactId}`, contact);

    return c.json({ contact });
  } catch (error) {
    console.log(`Error creating contact: ${error}`);
    return c.json({ error: "Failed to create contact" }, 500);
  }
});

app.put("/make-server-897e0759/iaps/:iapId/contacts/:contactId", async (c) => {
  try {
    const user = await getAuthenticatedUser(c.req.raw);

    if (!user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const iapId = c.req.param("iapId");
    const contactId = c.req.param("contactId");
    const body = await c.req.json();

    const existing = await kv.get(`contact:${user.id}:${iapId}:${contactId}`);

    if (!existing) {
      return c.json({ error: "Contact not found" }, 404);
    }

    const contact = {
      ...existing,
      ...body,
      id: contactId,
      iapId,
      updatedAt: new Date().toISOString(),
    };

    await kv.set(`contact:${user.id}:${iapId}:${contactId}`, contact);

    return c.json({ contact });
  } catch (error) {
    console.log(`Error updating contact: ${error}`);
    return c.json({ error: "Failed to update contact" }, 500);
  }
});

app.delete("/make-server-897e0759/iaps/:iapId/contacts/:contactId", async (c) => {
  try {
    const user = await getAuthenticatedUser(c.req.raw);

    if (!user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const iapId = c.req.param("iapId");
    const contactId = c.req.param("contactId");

    await kv.del(`contact:${user.id}:${iapId}:${contactId}`);

    return c.json({ success: true });
  } catch (error) {
    console.log(`Error deleting contact: ${error}`);
    return c.json({ error: "Failed to delete contact" }, 500);
  }
});

// ===== GENERIC DATA ROUTES (for organization, assignments, communications, medical, safety) =====

app.get("/make-server-897e0759/iaps/:iapId/:dataType", async (c) => {
  try {
    const user = await getAuthenticatedUser(c.req.raw);

    if (!user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const iapId = c.req.param("iapId");
    const dataType = c.req.param("dataType");

    const key = `${dataType}:${user.id}:${iapId}:`;
    console.log(`Fetching ${dataType} for IAP ${iapId}, key prefix: ${key}`);
    const data = await kv.getByPrefix(key);
    console.log(`Found ${data?.length || 0} items for ${dataType}`);

    return c.json({ data: data || [] });
  } catch (error) {
    console.log(`Error fetching data: ${error}`);
    return c.json({ error: "Failed to fetch data" }, 500);
  }
});

app.post("/make-server-897e0759/iaps/:iapId/:dataType", async (c) => {
  try {
    const user = await getAuthenticatedUser(c.req.raw);

    if (!user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const iapId = c.req.param("iapId");
    const dataType = c.req.param("dataType");
    const body = await c.req.json();

    // Use the ID from the body if provided, otherwise generate one
    const itemId = body.id || crypto.randomUUID();

    const item = {
      ...body,
      id: itemId,
      iapId,
      createdAt: new Date().toISOString(),
    };

    const key = `${dataType}:${user.id}:${iapId}:${itemId}`;
    console.log(`Creating ${dataType} item with key: ${key}`, item);
    await kv.set(key, item);

    return c.json({ item });
  } catch (error) {
    console.log(`Error creating data: ${error}`);
    return c.json({ error: "Failed to create data" }, 500);
  }
});

app.put("/make-server-897e0759/iaps/:iapId/:dataType/:itemId", async (c) => {
  try {
    const user = await getAuthenticatedUser(c.req.raw);

    if (!user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const iapId = c.req.param("iapId");
    const dataType = c.req.param("dataType");
    const itemId = c.req.param("itemId");
    const body = await c.req.json();

    const existing = await kv.get(`${dataType}:${user.id}:${iapId}:${itemId}`);
    if (!existing) {
      return c.json({ error: "Item not found" }, 404);
    }

    const item = {
      ...existing,
      ...body,
      updatedAt: new Date().toISOString(),
    };

    await kv.set(`${dataType}:${user.id}:${iapId}:${itemId}`, item);

    return c.json({ item });
  } catch (error) {
    console.log(`Error updating data: ${error}`);
    return c.json({ error: "Failed to update data" }, 500);
  }
});

app.delete("/make-server-897e0759/iaps/:iapId/:dataType/:itemId", async (c) => {
  try {
    const user = await getAuthenticatedUser(c.req.raw);

    if (!user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const iapId = c.req.param("iapId");
    const dataType = c.req.param("dataType");
    const itemId = c.req.param("itemId");

    await kv.del(`${dataType}:${user.id}:${iapId}:${itemId}`);

    return c.json({ success: true });
  } catch (error) {
    console.log(`Error deleting data: ${error}`);
    return c.json({ error: "Failed to delete data" }, 500);
  }
});

// ===== ACCOUNT REQUEST ROUTES =====

app.post("/make-server-897e0759/account-requests", async (c) => {
  try {
    const body = await c.req.json();
    const { email, name, organization } = body;

    if (!email || !name || !organization) {
      return c.json({ error: "Email, name, and organization are required" }, 400);
    }

    // Store account request
    const requestId = crypto.randomUUID();
    await kv.set(`account-request:${requestId}`, {
      id: requestId,
      email,
      name,
      organization,
      status: 'pending',
      created_at: new Date().toISOString(),
    });

    console.log(`Account request created: ${email}`);
    return c.json({ success: true });
  } catch (error) {
    console.log(`Error creating account request: ${error}`);
    return c.json({ error: "Failed to create account request" }, 500);
  }
});

// ===== ADMIN ROUTES =====

app.get("/make-server-897e0759/admin/account-requests", async (c) => {
  try {
    const user = await getAuthenticatedUser(c.req.raw);
    if (!user || !isAdmin(user)) {
      return c.json({ error: "Unauthorized - Admin access required" }, 403);
    }

    const requests = await kv.getByPrefix('account-request:');

    // Sort by created_at descending
    const sortedRequests = requests.sort((a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    return c.json(sortedRequests);
  } catch (error) {
    console.log(`Error fetching account requests: ${error}`);
    return c.json({ error: "Failed to fetch account requests" }, 500);
  }
});

app.post("/make-server-897e0759/admin/approve-request", async (c) => {
  try {
    const user = await getAuthenticatedUser(c.req.raw);
    if (!user || !isAdmin(user)) {
      return c.json({ error: "Unauthorized - Admin access required" }, 403);
    }

    const body = await c.req.json();
    const { requestId, email, name } = body;

    if (!requestId || !email || !name) {
      return c.json({ error: "Request ID, email, and name are required" }, 400);
    }

    // Create account using Supabase Admin API
    const supabase = getSupabaseClient(undefined, true);

    // Generate random password
    const password = crypto.randomUUID();

    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name },
    });

    if (error) {
      console.log(`Error creating user: ${error.message}`);
      return c.json({ error: `Failed to create user: ${error.message}` }, 500);
    }

    // Update request status
    const request = await kv.get(`account-request:${requestId}`);
    if (request) {
      await kv.set(`account-request:${requestId}`, {
        ...request,
        status: 'approved',
        approved_at: new Date().toISOString(),
      });
    }

    console.log(`Account approved and created: ${email}`);
    return c.json({ success: true, userId: data.user.id, temporaryPassword: password });
  } catch (error) {
    console.log(`Error approving request: ${error}`);
    return c.json({ error: "Failed to approve request" }, 500);
  }
});

app.post("/make-server-897e0759/admin/reject-request", async (c) => {
  try {
    const user = await getAuthenticatedUser(c.req.raw);
    if (!user || !isAdmin(user)) {
      return c.json({ error: "Unauthorized - Admin access required" }, 403);
    }

    const body = await c.req.json();
    const { requestId } = body;

    if (!requestId) {
      return c.json({ error: "Request ID is required" }, 400);
    }

    // Update request status
    const request = await kv.get(`account-request:${requestId}`);
    if (request) {
      await kv.set(`account-request:${requestId}`, {
        ...request,
        status: 'rejected',
        rejected_at: new Date().toISOString(),
      });
    }

    console.log(`Account request rejected: ${requestId}`);
    return c.json({ success: true });
  } catch (error) {
    console.log(`Error rejecting request: ${error}`);
    return c.json({ error: "Failed to reject request" }, 500);
  }
});

app.post("/make-server-897e0759/admin/create-account", async (c) => {
  try {
    const user = await getAuthenticatedUser(c.req.raw);
    if (!user || !isAdmin(user)) {
      return c.json({ error: "Unauthorized - Admin access required" }, 403);
    }

    const body = await c.req.json();
    const { email, password, name } = body;

    if (!email || !password || !name) {
      return c.json({ error: "Email, password, and name are required" }, 400);
    }

    // Create account using Supabase Admin API
    const supabase = getSupabaseClient(undefined, true);

    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name },
    });

    if (error) {
      console.log(`Error creating user: ${error.message}`);
      return c.json({ error: `Failed to create user: ${error.message}` }, 500);
    }

    console.log(`Account manually created: ${email}`);
    return c.json({ success: true, userId: data.user.id });
  } catch (error) {
    console.log(`Error creating account: ${error}`);
    return c.json({ error: "Failed to create account" }, 500);
  }
});

app.get("/make-server-897e0759/admin/all-iaps", async (c) => {
  try {
    const user = await getAuthenticatedUser(c.req.raw);
    if (!user || !isAdmin(user)) {
      return c.json({ error: "Unauthorized - Admin access required" }, 403);
    }

    const iaps = await kv.getByPrefix('iap:');

    // Sort by created_at descending
    const sortedIaps = iaps.sort((a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    return c.json(sortedIaps);
  } catch (error) {
    console.log(`Error fetching IAPs: ${error}`);
    return c.json({ error: "Failed to fetch IAPs" }, 500);
  }
});

app.get("/make-server-897e0759/admin/users", async (c) => {
  try {
    console.log('Admin users endpoint called');
    const user = await getAuthenticatedUser(c.req.raw);
    console.log('Authenticated user:', user?.email, 'isAdmin:', user ? isAdmin(user) : false);

    if (!user) {
      console.log('No user authenticated');
      return c.json({ error: "Unauthorized - Authentication required" }, 401);
    }

    if (!isAdmin(user)) {
      console.log('User is not admin:', user.email, 'metadata:', user.user_metadata);
      return c.json({ error: "Unauthorized - Admin access required" }, 403);
    }

    console.log('User is admin, fetching users list');
    const supabase = getSupabaseClient(undefined, true);

    const { data: { users }, error } = await supabase.auth.admin.listUsers();

    if (error) {
      console.log(`Error fetching users: ${error.message}`);
      return c.json({ error: `Failed to fetch users: ${error.message}` }, 500);
    }

    console.log(`Fetched ${users.length} users`);
    return c.json(users);
  } catch (error) {
    console.log(`Error fetching users: ${error}`);
    return c.json({ error: "Failed to fetch users" }, 500);
  }
});

app.post("/make-server-897e0759/admin/toggle-admin", async (c) => {
  try {
    const user = await getAuthenticatedUser(c.req.raw);
    if (!user || !isAdmin(user)) {
      return c.json({ error: "Unauthorized - Admin access required" }, 403);
    }

    const body = await c.req.json();
    const { userId, isAdmin: isAdminStatus } = body;

    if (!userId || typeof isAdminStatus !== 'boolean') {
      return c.json({ error: "User ID and isAdmin status are required" }, 400);
    }

    const supabase = getSupabaseClient(undefined, true);

    // Update user metadata
    const { data, error } = await supabase.auth.admin.updateUserById(userId, {
      user_metadata: { isAdmin: isAdminStatus },
    });

    if (error) {
      console.log(`Error updating user admin status: ${error.message}`);
      return c.json({ error: `Failed to update admin status: ${error.message}` }, 500);
    }

    console.log(`Admin status updated for user ${userId}: ${isAdminStatus}`);
    return c.json({ success: true });
  } catch (error) {
    console.log(`Error toggling admin status: ${error}`);
    return c.json({ error: "Failed to toggle admin status" }, 500);
  }
});

Deno.serve(app.fetch);
