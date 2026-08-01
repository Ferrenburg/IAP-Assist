import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "jsr:@supabase/supabase-js@2.49.8";
import * as kv from "./kv_store.ts";

// basePath('/server') = the function name. Supabase passes the request to Deno
// with the URL pathname including `/<function-name>/...`, so all routes need to
// live under that prefix. If you rename the function (deploy under a new name),
// update both this basePath and the API_BASE_URL in src/utils/api-client.ts.
const app = new Hono().basePath('/server');

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization", "apikey"],
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

// Helper to check if user is admin. Admin status lives in
// auth.users.app_metadata.isAdmin — NOT user_metadata. app_metadata can only
// be written with the service-role key (via this server or Supabase Studio's
// "Raw App Meta Data" field); user_metadata can be rewritten by the user
// themselves via the client SDK, so an admin flag stored there would let any
// signed-in user grant themselves admin access.
const isAdmin = (user: any): boolean => {
  return !!user && user.app_metadata?.isAdmin === true;
};

// Resolve the user's primary organization, creating one on first use.
// Lets pre-Phase-4 users (who don't yet have an org_members row) keep working.
const getOrCreateUserOrg = async (supabase: ReturnType<typeof createClient>, user: any): Promise<string> => {
  const { data: membership, error: memberErr } = await supabase
    .from('org_members')
    .select('org_id')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle();

  if (memberErr) {
    throw new Error(`org_members lookup failed: ${memberErr.message}`);
  }
  if (membership?.org_id) {
    return membership.org_id as string;
  }

  const orgName =
    user.user_metadata?.organization ||
    user.user_metadata?.name ||
    `${(user.email ?? 'user').split('@')[0]}'s Organization`;

  const { data: org, error: orgErr } = await supabase
    .from('organizations')
    .insert({ name: orgName })
    .select('id')
    .single();
  if (orgErr || !org) {
    throw new Error(`organization create failed: ${orgErr?.message ?? 'unknown'}`);
  }

  const { error: insertErr } = await supabase
    .from('org_members')
    .insert({ user_id: user.id, org_id: org.id, role: 'owner' });
  if (insertErr) {
    throw new Error(`org_members insert failed: ${insertErr.message}`);
  }

  console.log(`Auto-provisioned org ${org.id} for user ${user.id}`);
  return org.id as string;
};

// Flatten an incidents row + metadata JSONB into the legacy IAP shape the UI expects.
const serializeIncident = (row: any) => {
  const meta = row?.metadata ?? {};
  return {
    id: row.id,
    userId: row.created_by,
    orgId: row.org_id,
    name: row.name,
    incidentNumber: row.number ?? '',
    createdAt: row.created_at,
    updatedAt: meta.updatedAt ?? row.created_at,
    archivedAt: row.archived_at,
    archived: row.archived_at !== null,
    // Legacy / Figma-Make fields preserved in metadata until later sprints normalize them.
    jurisdiction: meta.jurisdiction ?? '',
    incidentCommander: meta.incidentCommander ?? '',
    incidentType: meta.incidentType ?? 'Wildfire',
    location: meta.location ?? '',
    startDate: meta.startDate ?? '',
    startTime: meta.startTime ?? '',
    description: meta.description ?? '',
    status: meta.status ?? 'draft',
    currentOP: meta.currentOP ?? 'OP 1',
    completionPercent: meta.completionPercent ?? 0,
  };
};

// Same idea for an operational_periods row.
const serializePeriod = (row: any) => {
  const meta = row?.metadata ?? {};
  return {
    id: row.id,
    iapId: row.incident_id,
    periodNumber: row.period_number,
    startAt: row.start_at,
    endAt: row.end_at,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: meta.updatedAt ?? row.created_at,
    ...meta, // any extra fields (name, type, dates in legacy keys, etc.)
  };
};

// Split a request body into known columns vs. metadata blob for incidents.
const splitIncidentBody = (body: any) => {
  const known: Record<string, any> = {};
  const meta: Record<string, any> = {};
  if (body.name !== undefined) known.name = body.name;
  if (body.incidentNumber !== undefined) known.number = body.incidentNumber;
  for (const [k, v] of Object.entries(body)) {
    if (k === 'name' || k === 'incidentNumber' || k === 'id' || k === 'userId') continue;
    meta[k] = v;
  }
  return { known, meta };
};

// Same for operational_periods.
const splitPeriodBody = (body: any) => {
  const known: Record<string, any> = {};
  const meta: Record<string, any> = {};
  if (body.periodNumber !== undefined) known.period_number = body.periodNumber;
  if (body.startAt !== undefined) known.start_at = body.startAt;
  if (body.endAt !== undefined) known.end_at = body.endAt;
  if (body.status !== undefined) known.status = body.status;
  for (const [k, v] of Object.entries(body)) {
    if (['periodNumber', 'startAt', 'endAt', 'status', 'id', 'iapId', 'incident_id'].includes(k)) continue;
    meta[k] = v;
  }
  return { known, meta };
};

// Health check endpoint
app.get("/health", (c) => {
  return c.json({ status: "ok" });
});

// ===== AUTHENTICATION ROUTES =====

app.post("/auth/signup", async (c) => {
  try {
    const body = await c.req.json();
    const { email, password, name, organizationName } = body;

    if (!email || !password || !name || !organizationName) {
      return c.json(
        { error: "Email, password, name, and organizationName are required" },
        400,
      );
    }

    const supabase = getSupabaseClient(undefined, true);
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { name, organization: organizationName },
      email_confirm: true, // Auto-confirm; transactional email isn't configured.
    });

    if (error || !data?.user) {
      console.log(`Signup error for ${email}: ${error?.message ?? 'unknown'}`);
      return c.json({ error: error?.message ?? 'Failed to create user' }, 400);
    }

    // Provision an organization for the new user. If this fails, the user still
    // exists; getOrCreateUserOrg() will lazy-create on first IAP action.
    try {
      const { data: org, error: orgErr } = await supabase
        .from('organizations')
        .insert({ name: organizationName })
        .select('id')
        .single();
      if (orgErr || !org) throw orgErr ?? new Error('org insert returned no row');

      const { error: memberErr } = await supabase
        .from('org_members')
        .insert({ user_id: data.user.id, org_id: org.id, role: 'owner' });
      if (memberErr) throw memberErr;

      console.log(`Created user ${data.user.id} + org ${org.id}`);
    } catch (provisionErr: any) {
      console.log(
        `Org provisioning failed for ${email} (will retry lazily): ${provisionErr?.message ?? provisionErr}`,
      );
    }

    return c.json({ user: data.user });
  } catch (error) {
    console.log(`Signup server error: ${error}`);
    return c.json({ error: "Failed to create user" }, 500);
  }
});

app.post("/auth/login", async (c) => {
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

app.post("/auth/logout", async (c) => {
  try {
    const supabase = getSupabaseClient(c.req.raw);
    await supabase.auth.signOut();

    return c.json({ success: true });
  } catch (error) {
    console.log(`Logout error: ${error}`);
    return c.json({ error: "Failed to sign out" }, 500);
  }
});

app.get("/auth/session", async (c) => {
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

// ===== IAP WORKSPACE ROUTES (relational, against `incidents`) =====

app.get("/iaps", async (c) => {
  try {
    const user = await getAuthenticatedUser(c.req.raw);
    if (!user) return c.json({ error: "Unauthorized" }, 401);

    const supabase = getSupabaseClient(undefined, true);

    const { data: memberships, error: memberErr } = await supabase
      .from('org_members')
      .select('org_id')
      .eq('user_id', user.id);
    if (memberErr) {
      console.log(`Error loading memberships: ${memberErr.message}`);
      return c.json({ error: "Failed to fetch IAPs" }, 500);
    }

    const orgIds = (memberships ?? []).map((m: any) => m.org_id);
    if (orgIds.length === 0) {
      return c.json({ iaps: [] });
    }

    const { data: rows, error: incErr } = await supabase
      .from('incidents')
      .select('*')
      .in('org_id', orgIds)
      .order('created_at', { ascending: false });
    if (incErr) {
      console.log(`Error fetching incidents: ${incErr.message}`);
      return c.json({ error: "Failed to fetch IAPs" }, 500);
    }

    return c.json({ iaps: (rows ?? []).map(serializeIncident) });
  } catch (error) {
    console.log(`Error fetching IAPs: ${error}`);
    return c.json({ error: "Failed to fetch IAPs" }, 500);
  }
});

app.get("/iaps/:iapId", async (c) => {
  try {
    const user = await getAuthenticatedUser(c.req.raw);
    if (!user) return c.json({ error: "Unauthorized" }, 401);

    const iapId = c.req.param("iapId");
    const supabase = getSupabaseClient(undefined, true);

    const { data: row, error } = await supabase
      .from('incidents')
      .select('*')
      .eq('id', iapId)
      .maybeSingle();
    if (error) {
      console.log(`Error fetching IAP: ${error.message}`);
      return c.json({ error: "Failed to fetch IAP" }, 500);
    }
    if (!row) return c.json({ error: "IAP not found" }, 404);

    // Membership check.
    const { data: membership } = await supabase
      .from('org_members')
      .select('org_id')
      .eq('user_id', user.id)
      .eq('org_id', row.org_id)
      .maybeSingle();
    if (!membership) return c.json({ error: "IAP not found" }, 404);

    return c.json({ iap: serializeIncident(row) });
  } catch (error) {
    console.log(`Error fetching IAP: ${error}`);
    return c.json({ error: "Failed to fetch IAP" }, 500);
  }
});

app.post("/iaps", async (c) => {
  try {
    const user = await getAuthenticatedUser(c.req.raw);
    if (!user) return c.json({ error: "Unauthorized" }, 401);

    const body = await c.req.json();
    const supabase = getSupabaseClient(undefined, true);

    const orgId = await getOrCreateUserOrg(supabase, user);
    const { known, meta } = splitIncidentBody(body);

    const { data: row, error } = await supabase
      .from('incidents')
      .insert({
        org_id: orgId,
        name: known.name ?? 'Untitled Incident',
        number: known.number ?? null,
        created_by: user.id,
        metadata: { ...meta, updatedAt: new Date().toISOString() },
      })
      .select('*')
      .single();
    if (error || !row) {
      console.log(`Error creating IAP: ${error?.message}`);
      return c.json({ error: "Failed to create IAP" }, 500);
    }

    console.log(`Created incident ${row.id} in org ${orgId}`);
    return c.json({ iap: serializeIncident(row) });
  } catch (error) {
    console.log(`Error creating IAP: ${error}`);
    return c.json({ error: "Failed to create IAP" }, 500);
  }
});

app.put("/iaps/:iapId", async (c) => {
  try {
    const user = await getAuthenticatedUser(c.req.raw);
    if (!user) return c.json({ error: "Unauthorized" }, 401);

    const iapId = c.req.param("iapId");
    const body = await c.req.json();
    const supabase = getSupabaseClient(undefined, true);

    const { data: existing, error: fetchErr } = await supabase
      .from('incidents')
      .select('*')
      .eq('id', iapId)
      .maybeSingle();
    if (fetchErr || !existing) {
      return c.json({ error: "IAP not found" }, 404);
    }

    const { data: membership } = await supabase
      .from('org_members')
      .select('org_id')
      .eq('user_id', user.id)
      .eq('org_id', existing.org_id)
      .maybeSingle();
    if (!membership) return c.json({ error: "IAP not found" }, 404);

    const { known, meta } = splitIncidentBody(body);
    const updatePayload: Record<string, any> = {};
    if (known.name !== undefined) updatePayload.name = known.name;
    if (known.number !== undefined) updatePayload.number = known.number;

    // archived_at toggle: support `archived: boolean` or `archived_at: string|null` in body.
    if (Object.prototype.hasOwnProperty.call(body, 'archived')) {
      updatePayload.archived_at = body.archived ? new Date().toISOString() : null;
    } else if (Object.prototype.hasOwnProperty.call(body, 'archived_at')) {
      updatePayload.archived_at = body.archived_at;
    }

    updatePayload.metadata = {
      ...(existing.metadata ?? {}),
      ...meta,
      updatedAt: new Date().toISOString(),
    };

    const { data: row, error } = await supabase
      .from('incidents')
      .update(updatePayload)
      .eq('id', iapId)
      .select('*')
      .single();
    if (error || !row) {
      console.log(`Error updating IAP: ${error?.message}`);
      return c.json({ error: "Failed to update IAP" }, 500);
    }

    return c.json({ iap: serializeIncident(row) });
  } catch (error) {
    console.log(`Error updating IAP: ${error}`);
    return c.json({ error: "Failed to update IAP" }, 500);
  }
});

app.delete("/iaps/:iapId", async (c) => {
  try {
    const user = await getAuthenticatedUser(c.req.raw);
    if (!user) return c.json({ error: "Unauthorized" }, 401);

    const iapId = c.req.param("iapId");
    const supabase = getSupabaseClient(undefined, true);

    const { data: existing } = await supabase
      .from('incidents')
      .select('org_id')
      .eq('id', iapId)
      .maybeSingle();
    if (!existing) return c.json({ error: "IAP not found" }, 404);

    const { data: membership } = await supabase
      .from('org_members')
      .select('org_id')
      .eq('user_id', user.id)
      .eq('org_id', existing.org_id)
      .maybeSingle();
    if (!membership) return c.json({ error: "IAP not found" }, 404);

    const { error } = await supabase.from('incidents').delete().eq('id', iapId);
    if (error) {
      console.log(`Error deleting IAP: ${error.message}`);
      return c.json({ error: "Failed to delete IAP" }, 500);
    }

    return c.json({ success: true });
  } catch (error) {
    console.log(`Error deleting IAP: ${error}`);
    return c.json({ error: "Failed to delete IAP" }, 500);
  }
});

// ===== OPERATIONAL PERIODS ROUTES (relational, against `operational_periods`) =====

// Helper: verify user has access to the parent incident, return its row.
const loadIncidentForUser = async (
  supabase: ReturnType<typeof createClient>,
  iapId: string,
  userId: string,
) => {
  const { data: incident } = await supabase
    .from('incidents')
    .select('id, org_id')
    .eq('id', iapId)
    .maybeSingle();
  if (!incident) return null;

  const { data: membership } = await supabase
    .from('org_members')
    .select('org_id')
    .eq('user_id', userId)
    .eq('org_id', incident.org_id)
    .maybeSingle();
  return membership ? incident : null;
};

app.get("/iaps/:iapId/periods", async (c) => {
  try {
    const user = await getAuthenticatedUser(c.req.raw);
    if (!user) return c.json({ error: "Unauthorized" }, 401);

    const iapId = c.req.param("iapId");
    const supabase = getSupabaseClient(undefined, true);

    const incident = await loadIncidentForUser(supabase, iapId, user.id);
    if (!incident) return c.json({ error: "IAP not found" }, 404);

    const { data: rows, error } = await supabase
      .from('operational_periods')
      .select('*')
      .eq('incident_id', iapId)
      .order('period_number', { ascending: true });
    if (error) {
      console.log(`Error fetching periods: ${error.message}`);
      return c.json({ error: "Failed to fetch periods" }, 500);
    }

    return c.json({ data: (rows ?? []).map(serializePeriod) });
  } catch (error) {
    console.log(`Error fetching periods: ${error}`);
    return c.json({ error: "Failed to fetch periods" }, 500);
  }
});

app.post("/iaps/:iapId/periods", async (c) => {
  try {
    const user = await getAuthenticatedUser(c.req.raw);
    if (!user) return c.json({ error: "Unauthorized" }, 401);

    const iapId = c.req.param("iapId");
    const body = await c.req.json();
    const supabase = getSupabaseClient(undefined, true);

    const incident = await loadIncidentForUser(supabase, iapId, user.id);
    if (!incident) return c.json({ error: "IAP not found" }, 404);

    const { known, meta } = splitPeriodBody(body);

    // Auto-assign period_number if not supplied: max + 1, defaulting to 1.
    let periodNumber = known.period_number;
    if (periodNumber === undefined) {
      const { data: maxRow } = await supabase
        .from('operational_periods')
        .select('period_number')
        .eq('incident_id', iapId)
        .order('period_number', { ascending: false })
        .limit(1)
        .maybeSingle();
      periodNumber = (maxRow?.period_number ?? 0) + 1;
    }

    const { data: row, error } = await supabase
      .from('operational_periods')
      .insert({
        incident_id: iapId,
        period_number: periodNumber,
        start_at: known.start_at ?? null,
        end_at: known.end_at ?? null,
        status: known.status ?? 'planned',
        metadata: { ...meta, updatedAt: new Date().toISOString() },
      })
      .select('*')
      .single();
    if (error || !row) {
      console.log(`Error creating period: ${error?.message}`);
      return c.json({ error: "Failed to create period" }, 500);
    }

    // Auto-create the matching shared-data row so future PUTs don't have to.
    await supabase
      .from('op_period_shared_data')
      .insert({ period_id: row.id })
      .select('period_id')
      .single()
      .then(() => null, () => null); // ignore conflict (already exists)

    console.log(`Created period ${row.id} for incident ${iapId}, number ${periodNumber}`);
    return c.json({ item: serializePeriod(row) });
  } catch (error) {
    console.log(`Error creating period: ${error}`);
    return c.json({ error: "Failed to create period" }, 500);
  }
});

app.put("/iaps/:iapId/periods/:periodId", async (c) => {
  try {
    const user = await getAuthenticatedUser(c.req.raw);
    if (!user) return c.json({ error: "Unauthorized" }, 401);

    const iapId = c.req.param("iapId");
    const periodId = c.req.param("periodId");
    const body = await c.req.json();
    const supabase = getSupabaseClient(undefined, true);

    const incident = await loadIncidentForUser(supabase, iapId, user.id);
    if (!incident) return c.json({ error: "IAP not found" }, 404);

    const { data: existing } = await supabase
      .from('operational_periods')
      .select('*')
      .eq('id', periodId)
      .eq('incident_id', iapId)
      .maybeSingle();
    if (!existing) return c.json({ error: "Period not found" }, 404);

    const { known, meta } = splitPeriodBody(body);
    const update: Record<string, any> = {
      metadata: { ...(existing.metadata ?? {}), ...meta, updatedAt: new Date().toISOString() },
    };
    if (known.period_number !== undefined) update.period_number = known.period_number;
    if (known.start_at !== undefined) update.start_at = known.start_at;
    if (known.end_at !== undefined) update.end_at = known.end_at;
    if (known.status !== undefined) update.status = known.status;

    const { data: row, error } = await supabase
      .from('operational_periods')
      .update(update)
      .eq('id', periodId)
      .select('*')
      .single();
    if (error || !row) {
      console.log(`Error updating period: ${error?.message}`);
      return c.json({ error: "Failed to update period" }, 500);
    }

    return c.json({ item: serializePeriod(row) });
  } catch (error) {
    console.log(`Error updating period: ${error}`);
    return c.json({ error: "Failed to update period" }, 500);
  }
});

app.delete("/iaps/:iapId/periods/:periodId", async (c) => {
  try {
    const user = await getAuthenticatedUser(c.req.raw);
    if (!user) return c.json({ error: "Unauthorized" }, 401);

    const iapId = c.req.param("iapId");
    const periodId = c.req.param("periodId");
    const supabase = getSupabaseClient(undefined, true);

    const incident = await loadIncidentForUser(supabase, iapId, user.id);
    if (!incident) return c.json({ error: "IAP not found" }, 404);

    const { data: existing } = await supabase
      .from('operational_periods')
      .select('id')
      .eq('id', periodId)
      .eq('incident_id', iapId)
      .maybeSingle();
    if (!existing) return c.json({ error: "Period not found" }, 404);

    const { error } = await supabase.from('operational_periods').delete().eq('id', periodId);
    if (error) {
      console.log(`Error deleting period: ${error.message}`);
      return c.json({ error: "Failed to delete period" }, 500);
    }

    return c.json({ success: true });
  } catch (error) {
    console.log(`Error deleting period: ${error}`);
    return c.json({ error: "Failed to delete period" }, 500);
  }
});

// ===== SHARED-DATA ROUTES =====
// Merged read/write across incidents + operational_periods + op_period_shared_data.
// This is the surface OpPeriodContext (Phase 5) consumes.

const loadSharedData = async (
  supabase: ReturnType<typeof createClient>,
  iapId: string,
  periodId: string,
) => {
  const { data: incRow } = await supabase
    .from('incidents')
    .select('id, name, number, org_id')
    .eq('id', iapId)
    .single();
  const { data: periodRow } = await supabase
    .from('operational_periods')
    .select('*')
    .eq('id', periodId)
    .eq('incident_id', iapId)
    .maybeSingle();
  if (!periodRow) return null;

  const { data: sharedRow } = await supabase
    .from('op_period_shared_data')
    .select('*')
    .eq('period_id', periodId)
    .maybeSingle();

  // Fall back to the org-level logo if this period has no explicit logo set.
  let agencyLogoUrl = sharedRow?.agency_logo_url ?? '';
  if (!agencyLogoUrl && incRow?.org_id) {
    const { data: orgRow } = await supabase
      .from('organizations')
      .select('logo_url')
      .eq('id', incRow.org_id)
      .maybeSingle();
    agencyLogoUrl = orgRow?.logo_url ?? '';
  }

  return {
    iapId,
    periodId,
    incidentName: incRow?.name ?? '',
    incidentNumber: incRow?.number ?? '',
    periodNumber: periodRow.period_number,
    startAt: periodRow.start_at,
    endAt: periodRow.end_at,
    status: periodRow.status,
    incidentCommander: sharedRow?.incident_commander ?? '',
    preparedByName: sharedRow?.prepared_by_name ?? '',
    preparedByTitle: sharedRow?.prepared_by_title ?? '',
    approvedByName: sharedRow?.approved_by_name ?? '',
    agencyName: sharedRow?.agency_name ?? '',
    agencyLogoUrl,
    updatedAt: sharedRow?.updated_at ?? null,
  };
};

app.get("/iaps/:iapId/periods/:periodId/shared", async (c) => {
  try {
    const user = await getAuthenticatedUser(c.req.raw);
    if (!user) return c.json({ error: "Unauthorized" }, 401);

    const iapId = c.req.param("iapId");
    const periodId = c.req.param("periodId");
    const supabase = getSupabaseClient(undefined, true);

    const incident = await loadIncidentForUser(supabase, iapId, user.id);
    if (!incident) return c.json({ error: "IAP not found" }, 404);

    const shared = await loadSharedData(supabase, iapId, periodId);
    if (!shared) return c.json({ error: "Period not found" }, 404);

    return c.json({ shared });
  } catch (error) {
    console.log(`Error fetching shared data: ${error}`);
    return c.json({ error: "Failed to fetch shared data" }, 500);
  }
});

app.put("/iaps/:iapId/periods/:periodId/shared", async (c) => {
  try {
    const user = await getAuthenticatedUser(c.req.raw);
    if (!user) return c.json({ error: "Unauthorized" }, 401);

    const iapId = c.req.param("iapId");
    const periodId = c.req.param("periodId");
    const body = await c.req.json();
    const supabase = getSupabaseClient(undefined, true);

    const incident = await loadIncidentForUser(supabase, iapId, user.id);
    if (!incident) return c.json({ error: "IAP not found" }, 404);

    const { data: existingPeriod } = await supabase
      .from('operational_periods')
      .select('id')
      .eq('id', periodId)
      .eq('incident_id', iapId)
      .maybeSingle();
    if (!existingPeriod) return c.json({ error: "Period not found" }, 404);

    // Route each field to the table that owns it.
    if (body.incidentName !== undefined || body.incidentNumber !== undefined) {
      const incPatch: Record<string, any> = {};
      if (body.incidentName !== undefined) incPatch.name = body.incidentName;
      if (body.incidentNumber !== undefined) incPatch.number = body.incidentNumber;
      const { error } = await supabase.from('incidents').update(incPatch).eq('id', iapId);
      if (error) throw error;
    }

    if (
      body.periodNumber !== undefined ||
      body.startAt !== undefined ||
      body.endAt !== undefined ||
      body.status !== undefined
    ) {
      const pPatch: Record<string, any> = {};
      if (body.periodNumber !== undefined) pPatch.period_number = body.periodNumber;
      if (body.startAt !== undefined) pPatch.start_at = body.startAt;
      if (body.endAt !== undefined) pPatch.end_at = body.endAt;
      if (body.status !== undefined) pPatch.status = body.status;
      const { error } = await supabase
        .from('operational_periods')
        .update(pPatch)
        .eq('id', periodId);
      if (error) throw error;
    }

    const sharedKeys = [
      'incidentCommander',
      'preparedByName',
      'preparedByTitle',
      'approvedByName',
      'agencyName',
      'agencyLogoUrl',
    ];
    const hasSharedPatch = sharedKeys.some((k) => body[k] !== undefined);
    if (hasSharedPatch) {
      const sPatch: Record<string, any> = { period_id: periodId };
      if (body.incidentCommander !== undefined) sPatch.incident_commander = body.incidentCommander;
      if (body.preparedByName !== undefined) sPatch.prepared_by_name = body.preparedByName;
      if (body.preparedByTitle !== undefined) sPatch.prepared_by_title = body.preparedByTitle;
      if (body.approvedByName !== undefined) sPatch.approved_by_name = body.approvedByName;
      if (body.agencyName !== undefined) sPatch.agency_name = body.agencyName;
      if (body.agencyLogoUrl !== undefined) sPatch.agency_logo_url = body.agencyLogoUrl;
      const { error } = await supabase
        .from('op_period_shared_data')
        .upsert(sPatch, { onConflict: 'period_id' });
      if (error) throw error;
    }

    const shared = await loadSharedData(supabase, iapId, periodId);
    return c.json({ shared });
  } catch (error: any) {
    console.log(`Error updating shared data: ${error?.message ?? error}`);
    return c.json({ error: "Failed to update shared data" }, 500);
  }
});

// ===== OBJECTIVES ROUTES =====

app.get("/iaps/:iapId/objectives", async (c) => {
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

app.post("/iaps/:iapId/objectives", async (c) => {
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

app.put("/iaps/:iapId/objectives/:objectiveId", async (c) => {
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

app.delete("/iaps/:iapId/objectives/:objectiveId", async (c) => {
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

app.get("/iaps/:iapId/contacts", async (c) => {
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

app.post("/iaps/:iapId/contacts", async (c) => {
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

app.put("/iaps/:iapId/contacts/:contactId", async (c) => {
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

app.delete("/iaps/:iapId/contacts/:contactId", async (c) => {
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

app.get("/iaps/:iapId/:dataType", async (c) => {
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

app.post("/iaps/:iapId/:dataType", async (c) => {
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

app.put("/iaps/:iapId/:dataType/:itemId", async (c) => {
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

app.delete("/iaps/:iapId/:dataType/:itemId", async (c) => {
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

// ===== ADMIN ROUTES =====
// (Admin-approval signup flow was removed in Phase 4 of Sprint 1; sign-up is
// now self-serve via POST /server/auth/signup. The remaining admin endpoints
// are read-only views of users + IAPs and an admin-toggle.)

app.get("/admin/all-iaps", async (c) => {
  try {
    const user = await getAuthenticatedUser(c.req.raw);
    if (!user || !isAdmin(user)) {
      return c.json({ error: "Unauthorized - Admin access required" }, 403);
    }

    const supabase = getSupabaseClient(undefined, true);
    const { data: rows, error } = await supabase
      .from('incidents')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      console.log(`Error fetching IAPs: ${error.message}`);
      return c.json({ error: "Failed to fetch IAPs" }, 500);
    }

    return c.json((rows ?? []).map(serializeIncident));
  } catch (error) {
    console.log(`Error fetching IAPs: ${error}`);
    return c.json({ error: "Failed to fetch IAPs" }, 500);
  }
});

app.get("/admin/users", async (c) => {
  try {
    console.log('Admin users endpoint called');
    const user = await getAuthenticatedUser(c.req.raw);
    console.log('Authenticated user:', user?.email, 'isAdmin:', user ? isAdmin(user) : false);

    if (!user) {
      console.log('No user authenticated');
      return c.json({ error: "Unauthorized - Authentication required" }, 401);
    }

    if (!isAdmin(user)) {
      console.log('User is not admin:', user.email, 'app_metadata:', user.app_metadata);
      return c.json({ error: "Unauthorized - Admin access required" }, 403);
    }

    console.log('User is admin, fetching users list');
    const supabase = getSupabaseClient(undefined, true);

    const { data: { users }, error } = await supabase.auth.admin.listUsers();

    if (error) {
      console.log(`Error fetching users: ${error.message}`);
      return c.json({ error: `Failed to fetch users: ${error.message}` }, 500);
    }

    // Attach org memberships (org name + role) so the panel can show which
    // account each user belongs to and who owns/administers it, in one call.
    const { data: memberRows, error: memberErr } = await supabase
      .from('org_members')
      .select('user_id, role, organizations(id, name)');
    if (memberErr) {
      console.log(`Error fetching org memberships: ${memberErr.message}`);
    }

    const membershipsByUser = new Map<string, { id: string; name: string; role: string }[]>();
    for (const row of memberRows ?? []) {
      const org = row.organizations as unknown as { id: string; name: string } | null;
      if (!org) continue;
      const list = membershipsByUser.get(row.user_id) ?? [];
      list.push({ id: org.id, name: org.name, role: row.role });
      membershipsByUser.set(row.user_id, list);
    }

    const usersWithOrgs = users.map((u) => ({
      ...u,
      organizations: membershipsByUser.get(u.id) ?? [],
    }));

    console.log(`Fetched ${users.length} users`);
    return c.json(usersWithOrgs);
  } catch (error) {
    console.log(`Error fetching users: ${error}`);
    return c.json({ error: "Failed to fetch users" }, 500);
  }
});

// List organizations (id + name) for the admin "create user" org picker.
app.get("/admin/organizations", async (c) => {
  try {
    const user = await getAuthenticatedUser(c.req.raw);
    if (!user || !isAdmin(user)) {
      return c.json({ error: "Unauthorized - Admin access required" }, 403);
    }

    const supabase = getSupabaseClient(undefined, true);
    const { data: rows, error } = await supabase
      .from('organizations')
      .select('id, name')
      .order('name', { ascending: true });
    if (error) {
      console.log(`Error fetching organizations: ${error.message}`);
      return c.json({ error: "Failed to fetch organizations" }, 500);
    }

    return c.json(rows ?? []);
  } catch (error) {
    console.log(`Error fetching organizations: ${error}`);
    return c.json({ error: "Failed to fetch organizations" }, 500);
  }
});

// Create a user account. Adds the new user to an existing org (orgId) or a
// brand-new one (organizationName), with the given role in that org.
app.post("/admin/users", async (c) => {
  try {
    const requester = await getAuthenticatedUser(c.req.raw);
    if (!requester || !isAdmin(requester)) {
      return c.json({ error: "Unauthorized - Admin access required" }, 403);
    }

    const body = await c.req.json();
    const { email, password, name, isAdmin: grantAdmin, orgId, organizationName, role } = body;

    if (!email || !password || !name) {
      return c.json({ error: "Email, password, and name are required" }, 400);
    }
    if (!orgId && !organizationName) {
      return c.json({ error: "Either orgId or organizationName is required" }, 400);
    }
    const memberRole = ['owner', 'admin', 'member'].includes(role) ? role : 'member';

    const supabase = getSupabaseClient(undefined, true);

    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { name, ...(organizationName ? { organization: organizationName } : {}) },
      app_metadata: { isAdmin: grantAdmin === true },
      email_confirm: true, // Auto-confirm; transactional email isn't configured.
    });
    if (error || !data?.user) {
      console.log(`Admin user-create error for ${email}: ${error?.message ?? 'unknown'}`);
      return c.json({ error: error?.message ?? 'Failed to create user' }, 400);
    }

    let resolvedOrgId: string | undefined = orgId;
    if (!resolvedOrgId) {
      const { data: org, error: orgErr } = await supabase
        .from('organizations')
        .insert({ name: organizationName })
        .select('id')
        .single();
      if (orgErr || !org) {
        console.log(`Org create failed while creating user ${data.user.id}: ${orgErr?.message}`);
        return c.json({ user: data.user, warning: 'User created but organization creation failed' }, 201);
      }
      resolvedOrgId = org.id as string;
    }

    const { error: memberErr } = await supabase
      .from('org_members')
      .insert({ user_id: data.user.id, org_id: resolvedOrgId, role: memberRole });
    if (memberErr) {
      console.log(`org_members insert failed for new user ${data.user.id}: ${memberErr.message}`);
      return c.json({ user: data.user, warning: 'User created but could not be added to the organization' }, 201);
    }

    console.log(`Admin ${requester.id} created user ${data.user.id} in org ${resolvedOrgId} as ${memberRole}`);
    return c.json({ user: data.user });
  } catch (error) {
    console.log(`Error creating user: ${error}`);
    return c.json({ error: "Failed to create user" }, 500);
  }
});

// Delete a user account. Refuses to delete the caller, and refuses to delete
// a user who still owns incidents (their org_members rows cascade-delete
// automatically, but incidents.created_by has no cascade — deleting first
// would either fail at the DB or silently orphan data).
app.delete("/admin/users/:userId", async (c) => {
  try {
    const requester = await getAuthenticatedUser(c.req.raw);
    if (!requester || !isAdmin(requester)) {
      return c.json({ error: "Unauthorized - Admin access required" }, 403);
    }

    const userId = c.req.param("userId");
    if (userId === requester.id) {
      return c.json({ error: "You cannot delete your own account" }, 400);
    }

    const supabase = getSupabaseClient(undefined, true);

    const { count, error: incErr } = await supabase
      .from('incidents')
      .select('id', { count: 'exact', head: true })
      .eq('created_by', userId);
    if (incErr) {
      console.log(`Error checking incidents for user ${userId}: ${incErr.message}`);
      return c.json({ error: "Failed to check user's incidents" }, 500);
    }
    if (count && count > 0) {
      return c.json(
        { error: `Cannot delete this user — they created ${count} incident(s). Reassign or delete those incidents first.` },
        409,
      );
    }

    const { error } = await supabase.auth.admin.deleteUser(userId);
    if (error) {
      console.log(`Error deleting user ${userId}: ${error.message}`);
      return c.json({ error: error.message }, 500);
    }

    console.log(`Admin ${requester.id} deleted user ${userId}`);
    return c.json({ success: true });
  } catch (error) {
    console.log(`Error deleting user: ${error}`);
    return c.json({ error: "Failed to delete user" }, 500);
  }
});

// Change a user's role (owner / admin / member) within one of their organizations.
app.put("/admin/users/:userId/org-role", async (c) => {
  try {
    const requester = await getAuthenticatedUser(c.req.raw);
    if (!requester || !isAdmin(requester)) {
      return c.json({ error: "Unauthorized - Admin access required" }, 403);
    }

    const userId = c.req.param("userId");
    const body = await c.req.json();
    const { orgId, role } = body;
    if (!orgId || !['owner', 'admin', 'member'].includes(role)) {
      return c.json({ error: "orgId and a valid role (owner, admin, member) are required" }, 400);
    }

    const supabase = getSupabaseClient(undefined, true);
    const { error } = await supabase
      .from('org_members')
      .update({ role })
      .eq('user_id', userId)
      .eq('org_id', orgId);
    if (error) {
      console.log(`Error updating org role for user ${userId}: ${error.message}`);
      return c.json({ error: "Failed to update role" }, 500);
    }

    console.log(`Admin ${requester.id} set user ${userId} role to ${role} in org ${orgId}`);
    return c.json({ success: true });
  } catch (error) {
    console.log(`Error updating org role: ${error}`);
    return c.json({ error: "Failed to update role" }, 500);
  }
});

app.post("/admin/toggle-admin", async (c) => {
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

    const { data: existing, error: fetchErr } = await supabase.auth.admin.getUserById(userId);
    if (fetchErr || !existing?.user) {
      console.log(`Error fetching user ${userId} for admin toggle: ${fetchErr?.message}`);
      return c.json({ error: "User not found" }, 404);
    }

    // app_metadata, not user_metadata — see the isAdmin() helper comment above
    // for why. updateUserById replaces app_metadata wholesale, so merge in the
    // existing values rather than clobbering them.
    const { data, error } = await supabase.auth.admin.updateUserById(userId, {
      app_metadata: { ...existing.user.app_metadata, isAdmin: isAdminStatus },
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

// ===== PROFILE ROUTES =====
// User profile reads/writes user_metadata on the auth.users record.

app.get("/profile", async (c) => {
  try {
    const user = await getAuthenticatedUser(c.req.raw);
    if (!user) return c.json({ error: "Unauthorized" }, 401);

    return c.json({
      profile: {
        name: user.user_metadata?.name ?? '',
        title: user.user_metadata?.title ?? '',
        email: user.email ?? '',
      },
    });
  } catch (error) {
    console.log(`Error fetching profile: ${error}`);
    return c.json({ error: "Failed to fetch profile" }, 500);
  }
});

app.put("/profile", async (c) => {
  try {
    const user = await getAuthenticatedUser(c.req.raw);
    if (!user) return c.json({ error: "Unauthorized" }, 401);

    const body = await c.req.json();
    const { name, title } = body;
    const supabase = getSupabaseClient(undefined, true);

    const patch: Record<string, any> = {};
    if (name !== undefined) patch.name = name;
    if (title !== undefined) patch.title = title;

    const { error } = await supabase.auth.admin.updateUserById(user.id, {
      user_metadata: { ...user.user_metadata, ...patch },
    });
    if (error) {
      console.log(`Error updating profile: ${error.message}`);
      return c.json({ error: "Failed to update profile" }, 500);
    }

    return c.json({ success: true });
  } catch (error) {
    console.log(`Error updating profile: ${error}`);
    return c.json({ error: "Failed to update profile" }, 500);
  }
});

// ===== ORG ROUTES =====
// Organization name + logo. Logo is stored in Supabase Storage bucket
// `agency-logos` and the public URL is persisted to organizations.logo_url.

// Helper: fetch org row, falling back gracefully when logo_url column not yet migrated.
const fetchOrgRow = async (supabase: ReturnType<typeof createClient>, orgId: string) => {
  const { data, error } = await supabase
    .from('organizations')
    .select('id, name, logo_url')
    .eq('id', orgId)
    .single();
  if (!error) return data as { id: string; name: string; logo_url: string | null };
  // Column may not exist yet (migration pending) — retry without it.
  if (error.code === '42703' || error.message?.includes('logo_url')) {
    const { data: basic, error: e2 } = await supabase
      .from('organizations')
      .select('id, name')
      .eq('id', orgId)
      .single();
    if (e2 || !basic) return null;
    return { ...(basic as { id: string; name: string }), logo_url: null };
  }
  return null;
};

app.get("/org", async (c) => {
  try {
    const user = await getAuthenticatedUser(c.req.raw);
    if (!user) return c.json({ error: "Unauthorized" }, 401);

    const supabase = getSupabaseClient(undefined, true);
    const orgId = await getOrCreateUserOrg(supabase, user);

    const org = await fetchOrgRow(supabase, orgId);
    if (!org) return c.json({ error: "Failed to fetch organization" }, 500);

    return c.json({ org });
  } catch (error) {
    console.log(`Error fetching org: ${error}`);
    return c.json({ error: "Failed to fetch organization" }, 500);
  }
});

app.put("/org", async (c) => {
  try {
    const user = await getAuthenticatedUser(c.req.raw);
    if (!user) return c.json({ error: "Unauthorized" }, 401);

    const body = await c.req.json();
    const supabase = getSupabaseClient(undefined, true);
    const orgId = await getOrCreateUserOrg(supabase, user);

    const patch: Record<string, any> = {};
    if (body.name !== undefined) patch.name = body.name;
    if (body.logoUrl !== undefined) patch.logo_url = body.logoUrl;

    // Skip logo_url in the patch if the column doesn't exist yet
    const hasLogoColumn = !('logo_url' in patch) || await (async () => {
      const { error } = await supabase.from('organizations').select('logo_url').limit(1);
      return !error;
    })();
    if (!hasLogoColumn) delete patch.logo_url;

    const { error: updateErr } = await supabase
      .from('organizations')
      .update(patch)
      .eq('id', orgId);
    if (updateErr) {
      console.log(`Error updating org: ${updateErr.message}`);
      return c.json({ error: "Failed to update organization" }, 500);
    }

    const org = await fetchOrgRow(supabase, orgId);
    if (!org) return c.json({ error: "Failed to fetch organization after update" }, 500);

    return c.json({ org });
  } catch (error) {
    console.log(`Error updating org: ${error}`);
    return c.json({ error: "Failed to update organization" }, 500);
  }
});

app.post("/org/logo", async (c) => {
  try {
    const user = await getAuthenticatedUser(c.req.raw);
    if (!user) return c.json({ error: "Unauthorized" }, 401);

    const supabase = getSupabaseClient(undefined, true);
    const orgId = await getOrCreateUserOrg(supabase, user);

    // Read raw body (the file bytes).
    const bodyBuffer = await c.req.arrayBuffer();
    const contentType = c.req.header('content-type') ?? 'image/png';
    const ext = contentType.includes('jpeg') || contentType.includes('jpg') ? 'jpg' : 'png';
    const storagePath = `${orgId}/logo.${ext}`;

    // Ensure the bucket exists — creates it on first use, ignored if already present.
    const { error: bucketErr } = await supabase.storage
      .createBucket('agency-logos', { public: true });
    if (bucketErr && !bucketErr.message?.toLowerCase().includes('already exist') && !bucketErr.message?.toLowerCase().includes('duplicate')) {
      console.log(`Bucket create warning: ${bucketErr.message}`);
    }

    const { error: uploadErr } = await supabase.storage
      .from('agency-logos')
      .upload(storagePath, bodyBuffer, {
        contentType,
        upsert: true,
      });
    if (uploadErr) {
      console.log(`Storage upload error: ${uploadErr.message}`);
      return c.json({ error: "Failed to upload logo" }, 500);
    }

    const { data: urlData } = supabase.storage
      .from('agency-logos')
      .getPublicUrl(storagePath);
    const logoUrl = urlData.publicUrl;

    // Persist the URL — skip if logo_url column not yet migrated (upload still succeeds).
    const { error: updateErr } = await supabase
      .from('organizations')
      .update({ logo_url: logoUrl })
      .eq('id', orgId);
    if (updateErr) {
      if (updateErr.code === '42703' || updateErr.message?.includes('logo_url')) {
        console.log('logo_url column missing — migration 0003_org_logo.sql not yet applied');
      } else {
        console.log(`Org logo_url update error: ${updateErr.message}`);
        return c.json({ error: "Failed to save logo URL" }, 500);
      }
    }

    console.log(`Uploaded logo for org ${orgId}: ${logoUrl}`);
    return c.json({ logoUrl });
  } catch (error) {
    console.log(`Error uploading logo: ${error}`);
    return c.json({ error: "Failed to upload logo" }, 500);
  }
});

Deno.serve(app.fetch);
