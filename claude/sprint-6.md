# Sprint 6 — IAP Assembly Page, Polish & QA

**Week:** 6
**Payment:** $250
**Status:** Not started

---

## Goal

Ship the dedicated IAP Assembly page UI, polish the entire app, run end-to-end QA, and deliver a production-ready MVP.

---

## Deliverables

### IAP Assembly Page UI
- [x] Dedicated export page
- [x] Auto-filled incident name and operational period
- [x] Prepared by and approved by fields (seeded from shared context, user-editable)
- [x] Checkboxes for each available form
- [x] Checkbox for weather attachment (with live "Data ready / No data" badge)
- [x] "Generate Combined IAP" action button

### Final Polish
- [ ] UI/UX refinements across all pages
- [x] Bug fixes from testing (ICS 205A KV key bug, logo auto-load)
- [ ] Performance optimization
- [ ] Error handling improvements
- [ ] Loading states everywhere they're needed
- [ ] Cross-browser testing (Chrome, Firefox, Safari, Edge) — manual QA step

### Quality Assurance
- [ ] End-to-end test: incident creation → IAP export
- [ ] Validate shared data sync across all forms
- [ ] PDF accuracy review (every form, cover, weather, combined)
- [ ] Edge case handling (empty fields, missing optional data, long text, etc.)

### Final Knowledge Transfer Package
- [x] Complete source code with documentation (CLAUDE.md + inline comments)
- [x] Database schema and setup instructions (docs/handoff/database-setup.md)
- [x] Environment configuration guide (docs/handoff/environment-and-deployment.md)
- [x] Deployment process documentation (docs/handoff/environment-and-deployment.md)
- [x] API documentation (docs/handoff/api-reference.md)

---

## Success Criteria

- [ ] IAP Assembly page allows selection and export of a complete IAP packet
- [ ] All shared data flows correctly across the entire application
- [ ] No critical bugs remain
- [ ] Application is stable, responsive, and production-ready
- [ ] Complete user flow works end-to-end without manual data re-entry

---

## Deliverables for Client Review

- Complete application walkthrough
- Bug report and resolution documentation
- Final QA testing results

---

## MVP Definition of Done (final checklist)

By end of this sprint, the MVP must demonstrate:

- [ ] User can create an incident and operational period
- [ ] User can enter shared op-period data one time
- [ ] Shared data automatically appears across all relevant forms
- [ ] All eight ICS forms are complete and functional
- [ ] Agency logo can be uploaded and appears on the cover page
- [ ] Weather data is retrieved from NWS API and generated as a PDF
- [ ] Individual ICS form PDFs can be exported
- [ ] A complete IAP packet can be generated from one export page
- [ ] Combined PDF downloads without manual assembly
- [ ] App is stable, responsive, and production-ready

---

## Progress Log

### 2026-06-01 — Sprint 6, Session 1

**Worked on:** Pre-implementation analysis, bug fixes in IAP Assembly page, weather status indicator, knowledge transfer documentation.

**Completed:**
- Full sprint analysis: reviewed all prior sprint sessions, mapped IAP Assembly page against sprint-6 deliverables
- Fix: ICS 205A KV key bug — assembly page was loading `period-{id}-communications-data` instead of `period-{id}-comms-contacts`, causing blank ICS 205A in every combined export
- Fix: org logo now auto-loads from `shared.agencyLogoUrl` (set via Account Settings) on mount — no more manual re-upload per export; user can still override with local upload
- Feature: weather data availability pre-check on mount — fetches weather KV key on load, shows "Data ready" (green) or "No data — visit Weather page first" (amber) badge on the weather checkbox; auto-checks the checkbox if data is available
- Docs: `docs/handoff/` created with 4 files: README.md (overview), database-setup.md (schema, KV store, migrations, Storage), environment-and-deployment.md (env vars, Supabase checklist, Vercel steps, ICS 207 calibration QA guide), api-reference.md (all edge function endpoints)

**In progress:**
- Nothing in flight.

**Decisions made:**
- ICS 207 coordinate calibration is a manual QA step — cannot be done without visual confirmation of a real PDF export; procedure documented in `docs/handoff/environment-and-deployment.md`
- QR code kept as plain-text URL on cover page (no QR image library added — out of original MVP scope per user decision)
- Logo auto-load uses `shared.agencyLogoUrl` from the op-period context; `logoPreview` local state is only set if it wasn't already set (so manual upload takes precedence)

**Blockers / open questions:**
- ICS 207 coordinates still need visual confirmation — export a test ICS 207 and eyeball all 8 position boxes; adjust `ICS_207_BLOCKS.orgChart` in `field-mappings.ts` if any are off
- Cross-browser testing (Firefox, Safari, Edge) is manual — load the app, create incident, fill all forms, export combined IAP, verify PDF opens correctly
- End-to-end QA smoke test still pending: full flow from sign-up → incident → period → all 8 forms → combined IAP export

**Next session should start with:**
- Export a test combined IAP (all forms checked) and verify: ICS 205A has contacts, org logo appears on cover, weather badge shows correct status, page numbers are correct
- Export ICS 207 alone and calibrate coordinates if needed
- Run end-to-end smoke test across all 8 forms

---

## Open Items

- [ ] ICS 207 coordinate visual calibration (export test PDF, compare positions, adjust ICS_207_BLOCKS in field-mappings.ts)
- [ ] End-to-end smoke test: sign-up → incident → period → all 8 forms → combined IAP export
- [ ] Cross-browser testing (Firefox, Safari, Edge) — manual QA
- [ ] Manual QA of the new admin user-management flows (create user into new/existing org, change org role, delete a user, confirm deletion is blocked for a user who owns incidents)

---

## Change Order — Admin: User Account Management (2026-08-01, client-requested, not in original scope)

Client (Sam) asked directly for employees to be able to see all user accounts, see who administers each account/organization, and create/delete accounts. This wasn't part of the original Sprint 6 plan, but was implemented as a direct client request rather than deferred, since the admin panel and admin-only routes already existed from Sprint 1.

- [x] `GET /admin/users` returns org membership (org name + role) per user
- [x] `GET /admin/organizations` — org picker list
- [x] `POST /admin/users` — create account (existing or new org, chosen org role, optional platform-admin grant)
- [x] `DELETE /admin/users/:userId` — delete account (blocks self-delete and deleting a user who owns incidents)
- [x] `PUT /admin/users/:userId/org-role` — change a member's org role
- [x] Admin panel UI: Organization column with inline role selector, Create User dialog, Delete action
- [ ] Client QA / sign-off

---

## Decisions & Notes

- Start the 60-day warranty clock from final acceptance of this sprint.
- Knowledge transfer documents should be in `docs/handoff/` — create that folder when ready.
