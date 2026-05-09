# Sprint 2 — Profile, Logo, Workspace Nav, ICS 202 & 203

**Week:** 2
**Payment:** $250
**Status:** Code complete — pending Vercel deploy + Supabase Storage bucket setup

---

## Goal

Build the user profile + logo upload flow, the workspace navigation shell, and the first two ICS forms (202 and 203) — both auto-populating shared data correctly.

---

## Deliverables

### User Profile
- [x] Profile settings page — Personal Details + Agency sections in Account Settings
- [x] Agency/organization name field — reads/writes `organizations.name` via GET/PUT /org
- [x] User details fields — name + position/title via GET/PUT /profile (user_metadata)
- [x] Agency logo upload to Supabase Storage — POST /org/logo, stored in `agency-logos` bucket
- [x] Logo retrievable for cover page and exports — auto-populates via `loadSharedData()` fallback

### Workspace Navigation
- [x] IAP workspace layout — sidebar groups: Command / Operations / Safety / Export
- [x] Tabs/sidebar for sections: Incident Info, ICS 202, 203, 204, 205/205A, 206, Weather, IAP Assembly
- [x] Active tab indicators — `usePathname()` highlights current route
- [x] Persistent navigation state — driven by URL

### ICS 202 — Incident Objectives
- [x] Structured form fields (incident objectives, command emphasis) — existing ObjectivesPage
- [x] Shared data auto-populates — incident info banner + Prepared By from OpPeriodContext
- [x] Save tied to current incident + op period — KV keyed by iapId + periodId
- [x] Load saved data on reopen — loadData() on mount

### ICS 203 — Organization Assignment List
- [x] Structured form fields — existing PersonnelPage
- [x] Shared data auto-populates — incident banner, Prepared By, IC syncs to context on change
- [x] Save and load functionality — existing save/load via KV

### Validation
- [x] Required field validation before export (202 + 203) — incident name required; 202 requires ≥1 objective

---

## Success Criteria

- [x] Users can upload and update an agency logo
- [x] Workspace navigation reaches all ICS form sections
- [x] ICS 202 and 203 display correctly with all required fields
- [x] Shared data auto-populates without manual re-entry
- [x] Form data saves and reloads correctly

---

## Deliverables for Client Review

- Profile and logo upload demonstration
- Workspace navigation walkthrough
- ICS 202 and 203 form walkthrough with shared data auto-population

---

## Progress Log

### 2026-05-07 — Sprint 2, Session 1

**Sprint 1 close-out bugs fixed first:**
- IAP Assembly wired to OpPeriodContext for Prepared By / Approved By (was using localStorage)
- Cover page crash fixed: `fromDate/fromTime` → parse `startAt`/`endAt` ISO timestamps
- Weather checkbox now shows Sprint 5 toast instead of silently skipping
- Sidebar period display fixed (same field name mismatch)
- 6 legacy dead files deleted

**Sprint 2 implemented:**
- DB migration `0003_org_logo.sql` — `organizations.logo_url` column
- 5 new edge function endpoints: GET/PUT `/profile`, GET/PUT `/org`, POST `/org/logo`
- 5 new `apiClient` methods to match
- `loadSharedData()` now falls back to `organizations.logo_url` when period has no explicit logo
- Account Settings page — Personal Details (name/title, saves to user_metadata) + Agency (name + logo upload to Supabase Storage)
- Sidebar: grouped workspace nav (Command / Operations / Safety / Export) with active highlighting
- ICS 202: incident info banner, `handleGenerateICS202` uses context instead of fetching periods, pre-export validation
- ICS 203: incident info banner, `handleGenerateICS203` uses context, IC field syncs to shared context on change

---

## Open Items

- **Supabase Storage bucket** — `agency-logos` bucket must be created manually in Supabase Studio (Storage → New Bucket, public). Storage RLS policy for org-member writes is recommended.
- **Vercel deploy** — env vars + Supabase Storage bucket needed before smoke test.
- **Form data normalization** — KV-backed form routes still used for 202/203 data (Sprint 3 scope).

---

## Decisions & Notes

- Logo stored at org level (not per-period) — uploaded once in Account Settings, auto-populates all exports.
- Sidebar uses grouped sections: Command / Operations / Safety / Export — matches client's nav spec from Sprint 2 requirements.
- IC name on Personnel page now syncs to `op_period_shared_data.incident_commander` via `updateShared()`, propagating to all forms.
