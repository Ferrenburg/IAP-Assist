# API Reference

All server-side logic runs in the Supabase edge function at:

```
https://{PROJECT_ID}.supabase.co/functions/v1/server
```

The client sends two headers on every request:

| Header | Value |
|--------|-------|
| `apikey` | `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` |
| `Authorization` | `Bearer {access_token}` (when the user is logged in) |

All routes are prefixed with `/server` (set via `app.basePath('/server')` in the Hono handler).

---

## Authentication

### `POST /server/auth/signup`
Create a user account, organization, and org membership in one transaction.

**Body:**
```json
{
  "email": "user@example.com",
  "password": "secret",
  "name": "Jane Smith",
  "organization": "City Fire Dept"
}
```

**Response:** `{ "user": {...}, "session": {...} }`

### `POST /server/auth/signin`
Sign in with email and password.

**Body:** `{ "email": "...", "password": "..." }`

**Response:** `{ "user": {...}, "session": {...} }`

### `POST /server/auth/signout`
Invalidate the current session.

---

## Profile & Organization

### `GET /server/profile`
Returns the logged-in user's profile from `auth.users.user_metadata`.

**Response:** `{ "profile": { "name": "...", "title": "..." } }`

### `PUT /server/profile`
Update name and/or title in `user_metadata`.

**Body:** `{ "name": "...", "title": "..." }`

### `GET /server/org`
Returns the user's organization record including `logo_url`.

**Response:** `{ "org": { "id": "...", "name": "...", "logo_url": "..." } }`

### `PUT /server/org`
Update the organization name.

**Body:** `{ "name": "..." }`

### `POST /server/org/logo`
Upload an agency logo. Accepts `multipart/form-data` with a `logo` file field. Stores in the `agency-logos` Supabase Storage bucket and updates `organizations.logo_url`.

**Response:** `{ "logoUrl": "https://..." }`

---

## Incidents (IAPs)

### `GET /server/iaps`
List all incidents for the user's organization.

**Response:** `{ "iaps": [...] }`

### `POST /server/iaps`
Create a new incident.

**Body:** `{ "name": "...", "number": "..." }`

**Response:** `{ "iap": { "id": "...", "name": "...", "number": "..." } }`

### `GET /server/iaps/:iapId`
Get a single incident by ID.

**Response:** `{ "iap": { ... } }`

### `PUT /server/iaps/:iapId`
Update incident name or number.

### `DELETE /server/iaps/:iapId`
Soft-delete (sets `archived_at`).

---

## Operational Periods

### `GET /server/iaps/:iapId/periods`
List all periods for an incident.

**Response:** `{ "data": [...] }`

### `POST /server/iaps/:iapId/periods`
Create a new operational period.

**Body:** `{ "periodNumber": 1, "startAt": "...", "endAt": "...", "status": "planned" }`

### `GET /server/iaps/:iapId/periods/:periodId`
Get a single period.

### `PUT /server/iaps/:iapId/periods/:periodId`
Update period dates, status, or number.

---

## Shared Op-Period Data

### `GET /server/iaps/:iapId/periods/:periodId/shared`
Get the shared op-period record. Merges `incidents`, `operational_periods`, and `op_period_shared_data` into one flat response. Falls back to `organizations.logo_url` for `agencyLogoUrl` if no period-specific logo is set.

**Response:**
```json
{
  "shared": {
    "iapId": "...",
    "periodId": "...",
    "incidentName": "...",
    "incidentNumber": "...",
    "periodNumber": 1,
    "startAt": "...",
    "endAt": "...",
    "status": "active",
    "incidentCommander": "...",
    "preparedByName": "...",
    "preparedByTitle": "...",
    "approvedByName": "...",
    "agencyName": "...",
    "agencyLogoUrl": "...",
    "updatedAt": "..."
  }
}
```

### `PUT /server/iaps/:iapId/periods/:periodId/shared`
Update any subset of shared fields. Returns the full merged record after update.

**Body:** any subset of the shared fields above.

---

## Generic KV Store (form data)

All ICS form content is stored via a generic CRUD API backed by `kv_store_897e0759`.

### `GET /server/iaps/:iapId/data/:key`
Read all rows for a given key.

**Response:** `{ "data": [...] }`

### `POST /server/iaps/:iapId/data/:key`
Create a new row.

**Body:** any JSON object.

### `PUT /server/iaps/:iapId/data/:key/:id`
Update a specific row by ID.

### `DELETE /server/iaps/:iapId/data/:key/:id`
Delete a specific row by ID.

See `database-setup.md` for the full list of KV keys used by each form.

---

## Weather (National Weather Service)

Weather data is fetched client-side directly from the NWS API (`https://api.weather.gov`). The app does **not** proxy weather requests through the edge function. The fetched data is then saved to the KV store under `period-{id}-weather` for persistence.

NWS API is US-only and unauthenticated. If coordinates are outside the US, the API returns a 404 and the app shows a warning toast. The combined IAP export degrades gracefully when no weather data is available.
