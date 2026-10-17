# Database Setup

OpPeriod uses **Supabase Postgres** as its database. All server-side queries go through the Hono edge function using the Supabase service-role key — never via direct client-to-Postgres connections.

---

## Running migrations

All migrations live in `supabase/migrations/`. Apply them in order via **Supabase Studio → SQL Editor**:

1. Open your Supabase project at `https://app.supabase.com`
2. Navigate to **SQL Editor**
3. Paste and run each migration file in order:
   - `0001_sprint1_schema.sql` — core relational tables
   - `0003_org_logo.sql` — adds `logo_url` to `organizations`

Migrations are idempotent (`CREATE TABLE IF NOT EXISTS`, `DROP TRIGGER IF EXISTS`) — safe to re-run.

---

## Relational tables

### `organizations`
Represents an agency or organization. One per sign-up.

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `name` | text | Agency name |
| `logo_url` | text \| null | Supabase Storage URL for agency logo (added in 0003) |
| `created_at` | timestamptz | |

### `org_members`
Links `auth.users` to `organizations`. Role-based (owner / admin / member).

| Column | Type | Notes |
|--------|------|-------|
| `user_id` | uuid FK → `auth.users` | |
| `org_id` | uuid FK → `organizations` | |
| `role` | text | `owner` \| `admin` \| `member` |
| `joined_at` | timestamptz | |

### `incidents`
One incident maps to one IAP. An org can have many incidents.

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `org_id` | uuid FK → `organizations` | |
| `name` | text | Incident name |
| `number` | text \| null | Incident number |
| `created_by` | uuid FK → `auth.users` | |
| `created_at` | timestamptz | |
| `archived_at` | timestamptz \| null | Soft-delete |

### `operational_periods`
Each incident can have multiple operational periods.

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `incident_id` | uuid FK → `incidents` | |
| `period_number` | int | Sequential within the incident |
| `start_at` | timestamptz \| null | Op period start |
| `end_at` | timestamptz \| null | Op period end |
| `status` | text | `planned` \| `active` \| `completed` |
| `created_at` | timestamptz | |

Unique constraint: `(incident_id, period_number)`.

### `op_period_shared_data`
The per-period overlay of shared fields. Extends `operational_periods` with fields that don't fit the base period record.

| Column | Type | Notes |
|--------|------|-------|
| `period_id` | uuid PK FK → `operational_periods` | One row per period |
| `incident_commander` | text \| null | |
| `prepared_by_name` | text \| null | |
| `prepared_by_title` | text \| null | |
| `approved_by_name` | text \| null | |
| `agency_name` | text \| null | |
| `agency_logo_url` | text \| null | Resolved at read time: period-specific override OR org `logo_url` |
| `updated_at` | timestamptz | Auto-updated by trigger |

---

## KV store

All form-specific data (ICS 202–208 content, weather, comms contacts, radio channels, etc.) is stored in a generic KV table:

**Table name:** `kv_store_897e0759`

| Column | Type |
|--------|------|
| `id` | uuid PK |
| `iap_id` | text | matches `incidents.id` |
| `key` | text | namespaced key (see below) |
| `data` | jsonb | arbitrary form payload |
| `created_at` | timestamptz |
| `updated_at` | timestamptz |

> **Important:** This table must be created manually in Supabase Studio. The edge function references it by name. The schema is defined in the edge function's `kv_store.ts` helper.

### KV key naming convention

All form data keys follow the pattern `period-{periodId}-{dataType}`:

| Key | Data |
|-----|------|
| `period-{id}-objectives` | ICS 202 objectives list |
| `period-{id}-command-emphasis` | ICS 202 command emphasis |
| `period-{id}-situation` | ICS 202 situation conditions |
| `period-{id}-personnel` | ICS 203/207 personnel flat object |
| `period-{id}-assignments` | ICS 204 assignment list |
| `period-{id}-assignments-prep` | ICS 204 prepared-by metadata |
| `period-{id}-radio-channels` | ICS 205 radio channels |
| `period-{id}-communications-data` | ICS 205 special instructions |
| `period-{id}-comms-contacts` | ICS 205A contact list |
| `period-{id}-medical-data` | ICS 206 medical metadata |
| `period-{id}-medical-stations` | ICS 206 aid stations |
| `period-{id}-transportation` | ICS 206 transportation |
| `period-{id}-hospitals` | ICS 206 hospitals |
| `period-{id}-safety-data` | ICS 208 safety messages |
| `period-{id}-weather` | Weather forecast + metadata |

---

## Row-Level Security

RLS is enabled on all tables. Policies are org-member scoped: a user can read/write rows belonging to organizations they are a member of.

The edge function uses the **service-role key**, which bypasses RLS. Direct client queries (if ever used) are subject to RLS.

---

## Supabase Storage

One bucket is required:

**Bucket:** `agency-logos`

- Must be created manually in Supabase Studio → Storage → New Bucket
- Set to **private** (not public) — the edge function generates signed URLs
- Access is controlled through the edge function; no direct bucket policies needed for MVP

The upload endpoint is `POST /server/org/logo` (see `api-reference.md`).
