# Sprint 1 — Setup, Auth, Incidents & Shared Data Model

**Week:** 1
**Payment:** $250
**Status:** Code complete; pending Vercel deploy + end-to-end smoke

---

## Goal

Stand up the project foundation: Next.js + Supabase + Vercel, working auth, and the database schema that supports the shared data model. By end of sprint, a user can sign up, create an incident, create an operational period within it, and enter shared data once that's accessible from anywhere.

---

## Deliverables

### Development Environment
- [x] Next.js project initialized (migrated from Vite to Next 15 App Router earlier in the session)
- [x] Git repository structure and branching strategy in place
- [ ] Vercel deployment configured *(awaiting click-through; env vars + secrets ready)*
- [x] Environment variables and secrets management set up — `src/utils/supabase-info.ts` reads `process.env.NEXT_PUBLIC_*`, throws clearly if missing
- [x] `.env.example` documenting all required vars

### Supabase Configuration
- [x] Database provisioned (project `tkdxkpzpkhhhlyfdtjde`)
- [x] Supabase Auth set up with email/password
- [x] Session handling working
- [x] Protected routes implemented (`<AuthGate>` in `src/app/_components/auth-gate.tsx`)

### Authentication
- [x] Sign up flow (direct, self-serve — admin-approval gate removed)
- [x] Login flow
- [x] Logout flow
- [x] Basic API error handling and validation
- [x] New Supabase publishable-key model (`sb_publishable_…`) wired into `apikey` header

### Database Schema
- [x] `organizations` table
- [x] `org_members` table (replaces a separate `users` table; `auth.users` is the user store)
- [x] `incidents` table
- [x] `operational_periods` table
- [x] `op_period_shared_data` table (the shared-data record per (incident, period))
- [x] Form-data stub tables: `form_objectives`, `form_assignments`, `form_communications`, `form_personnel`, `form_safety_medical` (created; endpoints stay on KV until each owning sprint normalizes)
- [x] Schema documentation written ([SCHEMA.md](../SCHEMA.md))
- [x] Row-Level Security enabled on every table with helper functions `is_org_member` + `user_can_access_period`

### Incident Management
- [x] Create incident
- [x] Edit incident (auto-saved via the new Incident Info workspace tab)
- [x] List incidents
- [x] Incident name + metadata entry
- [x] Switch between incidents
- [x] Archive / un-archive

### Operational Period Management
- [x] Create operational period within an incident
- [x] Set start and end date/time
- [x] Switch between operational periods
- [x] Auto-assigned `period_number` when not supplied (max+1)

### Shared Data Entry
- [x] Single entry point: the new **Incident Info** workspace tab (`/iap/[iapId]/period/[periodId]/incident-info`) edits all shared op-period fields:
  - incident name + number (live on `incidents`)
  - operational period number, start/end (live on `operational_periods`)
  - Incident Commander, Prepared By (name + title), Approved By (name), Agency / Organization (live on `op_period_shared_data`)
- [x] Org-on-signup: signup creates `organizations` row + assigns the user as `owner` in `org_members`

### Sync Engine
- [x] `OpPeriodContext` ([src/contexts/op-period-context.tsx](../src/contexts/op-period-context.tsx)) wraps every page in the operational-period segment, reads the merged shared-data record once via `apiClient.getSharedData()`, exposes `update(patch)` for optimistic updates that propagate via `apiClient.updateSharedData()`
- [x] Provider mounted in [app/iap/[iapId]/period/[periodId]/layout.tsx](../app/iap/%5BiapId%5D/period/%5BperiodId%5D/layout.tsx)
- [x] Workspace header banner reads `incidentName`, `incidentNumber`, `periodNumber`, dates from context
- [x] Incident Info page is the canonical editor; all writes go through `update()`
- [x] Form pages (objectives, personnel, assignments, communications, safety + medical) bind their `Prepared By` name + title inputs to context — edits on any page reflect on every other page without refetch

---

## Success Criteria

- [x] Users can create accounts and sign in
- [ ] App deploys successfully to Vercel *(pending click-through)*
- [x] DB schema supports the shared data model
- [x] Users can create and manage incidents and operational periods
- [x] Shared data is entered once and stored centrally
- [x] Shared data is accessible from any form context for the active period

---

## Deliverables for Client Review

- Working authentication flow demo
- Code repository access
- Database schema documentation ([SCHEMA.md](../SCHEMA.md))
- Incident, period, and shared data sync demonstration

---

## Progress Log

### 2026-04-30 — Vite → Next.js migration prep + cleanup
Cleared root-level junk (~14 stale docs, duplicate ICS PDFs, the `Test` placeholder, empty `guidelines/` folder, stray `utils/` wrapper). Wrote root `CLAUDE.md` synthesizing the planning context against the actual code. (Pre-Sprint-1 hygiene; not on the sprint deliverable list.)

### 2026-04-30 — Vite → Next.js migration
Migrated the entire repo from Vite + React Router to Next.js 15 App Router. 6 phases: Next install, `app/` scaffold, route files for all 19 routes, react-router → next/navigation rewrites across 26 files, PDF asset import fix in `pdf-generator-v2.ts`, Vite removal. Build + dev verified.

### 2026-05-01 — Sprint 1: foundations + schema
- Phase 1: moved Supabase credentials to env vars (`NEXT_PUBLIC_SUPABASE_PROJECT_ID`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`); migrated to Supabase's new publishable-key model (`apikey` header instead of `Authorization: Bearer`). Added `--no-verify-jwt` deploy flag note.
- Phase 2: wrote and applied [supabase/migrations/0001_sprint1_schema.sql](../supabase/migrations/0001_sprint1_schema.sql) (10 tables + RLS + helper fns) and [SCHEMA.md](../SCHEMA.md). Added [supabase/migrations/0002_metadata_columns.sql](../supabase/migrations/0002_metadata_columns.sql) for legacy-field JSONB compat.

### 2026-05-01 — Sprint 1: backend rewrite
- Phase 3: rewrote 9 endpoints (`/iaps` CRUD, `/iaps/:id/periods/...` CRUD, `/admin/all-iaps`) from KV-store to SQL against the new tables. Added `GET /iaps/:iapId/periods/:periodId/shared` and `PUT /iaps/:iapId/periods/:periodId/shared` for the merged shared-data record. Helpers: `getOrCreateUserOrg` (auto-bootstraps an org for users who don't have one), `loadIncidentForUser` (membership check), serializers for the legacy UI shape, JSONB metadata splitters. KV-backed routes for objectives/contacts/generic-data/account-requests left in place pending later sprints.
- Renamed `index.tsx → index.ts` and `kv_store.tsx → kv_store.ts` (Supabase rejects `.tsx` entry files).
- Switched the function path layout: dropped the `make-server-897e0759` Figma Make legacy prefix from all routes; added `app.basePath('/server')` so route registration matches Supabase's URL convention (`/functions/v1/<fn-name>/...`).
- CORS allowHeaders now include `apikey` (required for the new keys).

### 2026-05-01 — Sprint 1: direct signup + sync engine
- Phase 4: signup endpoint now creates user + organization + org_members in one round-trip. Auth UI flips from "Request Account → admin approval" to a real Sign Up form (email, password, name, organization). Removed admin-approval endpoints (`/account-requests`, `/admin/approve-request`, `/admin/reject-request`, `/admin/create-account`) and the corresponding tabs in the admin page. Dropped the hardcoded `sam@ferrenburg.com` admin fallback — admin status now lives entirely in `auth.users.user_metadata.isAdmin`.
- Phase 5: built [src/contexts/op-period-context.tsx](../src/contexts/op-period-context.tsx) with `useOpPeriod()` (strict, throws outside provider) and `useOpPeriodOptional()` (permissive, used by the workspace-header which renders on non-iap routes too). Mounted `OpPeriodProvider` in the period segment's layout.
- Refactored Incident Info into a two-section editor: shared op-period fields (sync via context) + incident-level metadata (still via `apiClient.updateIAP`, stored in `incidents.metadata`). Added it as a workspace tab.
- Bound the `Prepared By` name + title inputs in objectives/personnel/assignments/communications/safety-medical to the shared context. Editing any of them propagates to every other page in the same operational period.
- Workspace-header banner now reads incident name + number + period number + dates from context, replacing the per-page periods fetch.

### 2026-05-01 — Sprint 1: docs
- Updated this file's Progress Log + checkboxes to reflect actual state.
- Appended session entry to [PROGRESS.md](PROGRESS.md).
- Updated [CLAUDE.md](../CLAUDE.md) — directory map mentions `OpPeriodContext`, signup flow notes corrected.

---

## Open Items

- **Vercel deploy + smoke test** — not blocked by code; needs a click-through of the Vercel project import + env vars (Preview + Production scopes), then end-to-end verification on the preview URL.
- **Branching flow** — `dev` integration branch already exists. Sprint 2 PRs target `dev`; merge `dev → main` at sprint completion after client approval.
- **Form-data tables** — `form_objectives`, `form_assignments`, etc. exist but their endpoints still hit KV. Sprint 2 (objectives, personnel, ICS 202/203) will start normalizing.
- **Per-page form state stored alongside shared data** — the form pages still maintain their own `preparedByName` / `positionTitle` in their per-page data blobs (left in place to avoid touching save logic). The displayed input value comes from the shared context, but the legacy KV blob fields are now stale. Cleanup is fine to do incrementally as each form normalizes.
- **`next.config.mjs` build-error suppression** — `typescript.ignoreBuildErrors: true` and `eslint.ignoreDuringBuilds: true` are still on. Re-enable once type/lint issues are addressed.

---

## Decisions & Notes

- **DB model: relational, not KV** — chosen over a hybrid KV+relational approach to align with the spec. Existing KV table (`kv_store_897e0759`) kept for form-data routes that haven't been normalized yet; explicitly slated for migration in later sprints.
- **Org bootstrap is lazy** — `getOrCreateUserOrg` will create an org on first incident write if a user doesn't have one. This keeps backward-compat with any pre-Phase-4 accounts and survives the unlikely race where signup's org creation fails after user creation.
- **Schema: one `op_period_shared_data` row per period, joined with `incidents` + `operational_periods` for the full shared record.** Picked over a single denormalized table to avoid duplicating incident-level fields per period.
- **Metadata JSONB columns on `incidents` and `operational_periods`** — preserves the Figma-Make-era loose fields (`jurisdiction`, `incidentType`, `location`, `description`, `completionPercent`, etc.) without forcing a UI rewrite this sprint. Each later sprint can promote a key to a real column when it normalizes.
- **Admin email** — hardcoded `sam@ferrenburg.com` fallback removed. Admin status set via `auth.users.user_metadata.isAdmin = true` in Supabase Studio.
- **Function path** — dropped the `make-server-897e0759` Figma Make namespace. Routes now live under `/functions/v1/server/...` via Hono's `basePath('/server')`. If the function is ever renamed, both `app.basePath()` and `API_BASE_URL` in `src/utils/api-client.ts` must change together.
