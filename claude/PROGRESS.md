# PROGRESS.md — OpPeriod MVP Session Log

A running log of work done across all sessions. Most recent entry at the top.

**Update protocol:** Append a new entry at the end of every session. See `CLAUDE.md` → "Session Protocol" for the template and rules.

---

## Status Snapshot

- **Current sprint:** Sprint 2 — code complete; pending Vercel deploy + Supabase Storage bucket setup
- **Sprint started:** 2026-05-07
- **Last session:** 2026-05-07 — Sprint 1 bug fixes + full Sprint 2 implementation
- **Next session focus:** Vercel deploy (env vars + `agency-logos` bucket) + end-to-end smoke test; then Sprint 3 kickoff (ICS 204, 205, 205A, 206)

---

## Session Log

<!-- Newest entries go here, at the top of the log. -->

### 2026-05-07 — Sprint 2, Session 1

**Worked on:** Sprint 1 close-out bug fixes (5 bugs) + full Sprint 2 implementation (grouped nav, profile/logo, ICS 202/203 completion).

**Completed:**
- Fix A — IAP Assembly now seeds Prepared By/Approved By from OpPeriodContext, not localStorage
- Fix B — IAP Assembly cover page crash fixed: `fromDate/fromTime` → `startAt`/`endAt` ISO parse
- Fix C — Weather checkbox in IAP Assembly shows Sprint 5 toast instead of silently skipping
- Fix D — Confirmed assignments, comms, safety-medical pages were already wired; sidebar period dates fixed too
- Fix E — Deleted 6 dead legacy files (pdf-generator.ts, field-mappings-old.ts, 4 old page components)
- S2.1 — DB migration `0003_org_logo.sql` adds `organizations.logo_url`
- S2.2 — 5 new edge function routes (GET/PUT /profile, GET/PUT /org, POST /org/logo) + 5 api-client methods
- S2.3 — Supabase Storage bucket setup documented in sprint-2.md Open Items
- S2.4 — Account Settings page rewritten: Personal Details (name/title → user_metadata) + Agency (name + logo upload)
- S2.5 — `loadSharedData()` falls back to `organizations.logo_url` when period has no explicit logo
- S2.6 — Sidebar: grouped workspace nav (Command / Operations / Safety / Export) with Link + active highlighting
- S2.7 — ICS 202: incident info banner, PDF generator uses context (no period refetch), validation added
- S2.8 — ICS 203: incident info banner, PDF generator uses context, IC field syncs to shared context on change

**In progress:**
- Nothing in flight. Code is at a clean stopping point.

**Decisions made:**
- Logo is org-level (not per-period) — uploaded once in Account Settings, auto-populates all future exports.
- Sidebar groups match client's Sprint 2 spec: Command / Operations / Safety / Export.
- IC name on Personnel page now writes to both local KV state AND `op_period_shared_data` via `updateShared()`.

**Blockers / open questions:**
- **Supabase Storage bucket `agency-logos`** — must be created manually in Supabase Studio before logo upload works. No API to create buckets programmatically in self-hosted Supabase.
- **Vercel deploy** — still needs click-through with env vars. Same two vars as Sprint 1.

**Next session should start with:**
- Vercel deploy + `agency-logos` bucket creation + 11-step smoke test from the Sprint 2 verification list.
- If green, close Sprint 2, request client approval/payment, then start Sprint 3 (ICS 204, 205, 205A, 206).

### 2026-05-01 — Sprint 1, Session 1

**Worked on:** Full Sprint 1 implementation — env vars + new Supabase publishable-key model, relational schema migration, KV → SQL backend rewrite for incidents/periods/shared-data, direct sign-up flow, OpPeriodContext sync engine, page refactors.

**Completed:**
- Phase 1 — env-var pipeline (`NEXT_PUBLIC_SUPABASE_PROJECT_ID`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`); `.env.example`; README updated; migrated to Supabase's new `sb_publishable_*` keys (`apikey` header, `--no-verify-jwt` deploy flag).
- Phase 2 — schema migrations applied: `organizations`, `org_members`, `incidents`, `operational_periods`, `op_period_shared_data`, 5 form-stub tables. RLS + helper fns. SCHEMA.md written.
- Phase 3 — backend rewrite: 9 endpoints now hit SQL tables; new `/iaps/:iapId/periods/:periodId/shared` GET + PUT; helpers (`getOrCreateUserOrg`, `loadIncidentForUser`, serializers). Renamed edge function entry files `.tsx → .ts`. Dropped `make-server-897e0759` Figma Make namespace; switched to `app.basePath('/server')`.
- Phase 4 — direct signup: signup endpoint creates user + org + org_members in one call. Auth UI rewritten as a real Sign Up form (email, password, name, organization). Removed admin-approval endpoints + admin-page tabs. Dropped hardcoded `sam@ferrenburg.com` admin fallback.
- Phase 5 — `OpPeriodContext` provider + hook. Mounted in iap workspace layout. Workspace-header banner reads from context. Incident Info routed as a workspace tab; canonical editor for shared fields. The 5 form pages bind their `Prepared By` inputs to shared context.
- Phase 6 — sprint-1.md updated; this entry.

**In progress:**
- Nothing in flight. Code is at a clean stopping point.

**Decisions made:**
- Migrated KV → relational tables (per Sprint 1 spec) rather than the hybrid option. `kv_store_897e0759` retained for form-data routes still on KV (objectives/contacts/generic data) until each owning sprint normalizes.
- Lazy org bootstrap (`getOrCreateUserOrg`) handles the case where signup's org-creation step fails or where a pre-Phase-4 user signed in.
- `metadata jsonb` on `incidents` and `operational_periods` preserves legacy Figma-Make fields losslessly so the existing UI keeps working.
- `useOpPeriodOptional` for the workspace-header which renders both inside and outside the iap segment.

**Blockers / open questions:**
- Vercel deploy is click-through-only — needs the user to import the GitHub repo + set the two `NEXT_PUBLIC_*` env vars under Project Settings → Environment Variables (Preview + Production).
- End-to-end smoke not yet run against the live deploy. Plan: sign up → create incident → create period → enter shared data on Incident Info → navigate to objectives/assignments → confirm shared fields appear without re-entry.

**Next session should start with:**
- Vercel deploy + 9-step verification list in [sprint-1.md](sprint-1.md). If green, close Sprint 1 and start Sprint 2.

---

## Sprint Completion Summaries

A short summary added at the close of each sprint (after client approval).

### Sprint 1 — _not yet complete_
### Sprint 2 — _not yet started_
### Sprint 3 — _not yet started_
### Sprint 4 — _not yet started_
### Sprint 5 — _not yet started_
### Sprint 6 — _not yet started_
