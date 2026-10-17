# Database schema

Source of truth: [supabase/migrations/](supabase/migrations/). This document describes the schema in human terms — when migrations change, update this file in the same PR.

The schema is split between two stores during the Sprint-1 → Sprint-6 transition:

- **Relational tables** (this document) own incidents, operational periods, the shared-data record, and per-form data tables. Created in [supabase/migrations/0001_sprint1_schema.sql](supabase/migrations/0001_sprint1_schema.sql).
- **`kv_store_897e0759`** (legacy) still backs the older form-data endpoints (objectives, contacts, generic data routes) until each owning sprint migrates them. New code should not write to `kv_store_897e0759`.

All tables live in the `public` schema. UUIDs come from `gen_random_uuid()` (`pgcrypto` extension).

---

## Tables

### `organizations`
The tenancy root. Every incident belongs to exactly one organization.

| Column       | Type          | Notes                       |
| ------------ | ------------- | --------------------------- |
| `id`         | `uuid` PK     | `default gen_random_uuid()` |
| `name`       | `text`        | not null                    |
| `created_at` | `timestamptz` | `default now()`             |

### `org_members`
Membership join table between `auth.users` and `organizations`. Composite primary key on `(user_id, org_id)`.

| Column      | Type          | Notes                                         |
| ----------- | ------------- | --------------------------------------------- |
| `user_id`   | `uuid` FK     | → `auth.users.id`, on delete cascade          |
| `org_id`    | `uuid` FK     | → `organizations.id`, on delete cascade       |
| `role`      | `text`        | `'owner' \| 'admin' \| 'member'`, default `'member'` |
| `joined_at` | `timestamptz` | `default now()`                               |

### `incidents`
What the UI calls "IAPs." One row per incident, scoped to an organization.

| Column        | Type          | Notes                                |
| ------------- | ------------- | ------------------------------------ |
| `id`          | `uuid` PK     |                                      |
| `org_id`      | `uuid` FK     | → `organizations.id`, cascade delete |
| `name`        | `text`        | not null                             |
| `number`      | `text`        | nullable; free-form incident number  |
| `created_by`  | `uuid` FK     | → `auth.users.id`                    |
| `created_at`  | `timestamptz` | `default now()`                      |
| `archived_at` | `timestamptz` | null = active; non-null = archived   |

### `operational_periods`
One row per operational period under an incident. `period_number` is unique within an incident.

| Column          | Type          | Notes                                                        |
| --------------- | ------------- | ------------------------------------------------------------ |
| `id`            | `uuid` PK     |                                                              |
| `incident_id`   | `uuid` FK     | → `incidents.id`, cascade delete                             |
| `period_number` | `int`         | not null; unique with `incident_id`                          |
| `start_at`      | `timestamptz` | nullable                                                     |
| `end_at`        | `timestamptz` | nullable                                                     |
| `status`        | `text`        | `'planned' \| 'active' \| 'completed'`, default `'planned'` |
| `created_at`    | `timestamptz` | `default now()`                                              |

### `op_period_shared_data`
The per-period overlay of shared-data fields that don't fit on `incidents` or `operational_periods`. Exactly one row per period — `period_id` is both PK and FK.

The full **shared-data record** that the UI reads is the merge of three sources:
- `incidents.name` / `incidents.number` (the "incident" half)
- `operational_periods.period_number` / `start_at` / `end_at` (the "period" half)
- `op_period_shared_data.*` (the rest — IC, prepared by, approved by, agency)

| Column               | Type          | Notes                                          |
| -------------------- | ------------- | ---------------------------------------------- |
| `period_id`          | `uuid` PK FK  | → `operational_periods.id`, cascade delete     |
| `incident_commander` | `text`        |                                                |
| `prepared_by_name`   | `text`        |                                                |
| `prepared_by_title`  | `text`        |                                                |
| `approved_by_name`   | `text`        |                                                |
| `agency_name`        | `text`        |                                                |
| `agency_logo_url`    | `text`        | URL into Supabase Storage (Sprint 2 deliverable) |
| `updated_at`         | `timestamptz` | maintained by `trg_set_updated_at`             |

### Form-data stubs

`form_objectives`, `form_assignments`, `form_communications`, `form_personnel`, `form_safety_medical` — all share the same shape. Sprint 1 creates the tables but the endpoints stay on `kv_store_897e0759`; each sprint that owns a form normalizes its table.

| Column       | Type          | Notes                                       |
| ------------ | ------------- | ------------------------------------------- |
| `id`         | `uuid` PK     |                                             |
| `period_id`  | `uuid` FK     | → `operational_periods.id`, cascade delete  |
| `data`       | `jsonb`       | not null, default `'{}'::jsonb`             |
| `updated_at` | `timestamptz` | maintained by `trg_set_updated_at`          |

---

## Row-Level Security

RLS is **enabled on every Sprint-1 table**. The principle: a user can read/write a row when they belong to the row's organization (directly via `org_members`, or transitively through `incidents` → `operational_periods` → `op_period_shared_data` / `form_*`).

Two helper functions:
- `is_org_member(user_id, org_id) → boolean` — direct membership check.
- `user_can_access_period(period_id) → boolean` — joins through period → incident → org.

Per-table policies:
- `organizations` — select-only via `is_org_member`; writes go server-side (service-role).
- `org_members` — select self or fellow members.
- `incidents` — full CRUD for any org member.
- `operational_periods` — full CRUD scoped via parent incident's org.
- `op_period_shared_data` — full CRUD scoped via period → incident → org.
- `form_*` — full CRUD scoped via `user_can_access_period`.

The Edge Function in [supabase/functions/server/index.tsx](supabase/functions/server/index.tsx) uses the service-role key, which bypasses RLS. Direct PostgREST access from the client respects the policies above.

---

## Triggers

`trg_set_updated_at` on every table that has an `updated_at` column. Calls `public.set_updated_at()` to set `new.updated_at = now()` on every UPDATE.

---

## Applying the migration

Either:

1. **Via Supabase Studio** — open the SQL Editor for the project, paste the contents of [supabase/migrations/0001_sprint1_schema.sql](supabase/migrations/0001_sprint1_schema.sql), click Run. The script is idempotent (uses `create … if not exists` and `drop policy if exists`).
2. **Via Supabase CLI** — `supabase link --project-ref <ref>` then `supabase db push`.

After applying, verify in Studio → Database → Tables that all 10 tables exist and RLS is on for each.

---

## Conventions

- Cascade deletes flow downward: deleting an organization deletes its incidents → periods → shared-data + form rows.
- New tables that hold per-period data should follow the form-stub shape (`id`, `period_id`, `data jsonb`, `updated_at`) and reuse the `set_updated_at()` trigger + `user_can_access_period()` policy helper.
- Don't add new tables outside this document. When you add or change a table, update the migration file *and* this document in the same PR.
