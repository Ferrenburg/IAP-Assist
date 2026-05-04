# PROGRESS.md — OpPeriod MVP Session Log

A running log of work done across all sessions. Most recent entry at the top.

**Update protocol:** Append a new entry at the end of every session. See `CLAUDE.md` → "Session Protocol" for the template and rules.

---

## Status Snapshot

- **Current sprint:** Sprint 1 — code complete; pending Vercel deploy + smoke test
- **Sprint started:** 2026-05-01
- **Last session:** 2026-05-01 — full Sprint 1 implementation in one session
- **Next session focus:** Vercel deploy click-through + end-to-end smoke; then Sprint 2 kickoff (Profile, Logo, Workspace Nav, ICS 202 & 203)

---

## Session Log

<!-- Newest entries go here, at the top of the log. -->

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
