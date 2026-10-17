# CLAUDE.md — OpPeriod MVP

This file gives Claude Code the context it needs to work on this project effectively. Read it at the start of every session.

---

## Project Overview

**OpPeriod** is a lightweight SaaS application for public safety agencies to create, manage, and export Incident Action Plan (IAP) documents for a single operational period.

The core product principle is **shared data synchronization**: common data is entered once per operational period and automatically populates every form, field, and export where it belongs.

- **Client:** Samuel Ferrenburg / OpPeriod
- **Developer:** Hassan Amjad
- **Platform:** Upwork
- **Total Contract:** $1,500 over 6 weekly sprints ($250/sprint)
- **Contract:** See `docs/OpPeriod_MVP_Agreement.pdf`

---

## Tech Stack

| Layer            | Technology                                       |
| ---------------- | ------------------------------------------------ |
| Frontend         | Next.js (React)                                  |
| Backend / API    | Next.js API Routes                               |
| Database         | Supabase (PostgreSQL)                            |
| Auth             | Supabase Auth (email/password)                   |
| File Storage     | Supabase Storage                                 |
| PDF Generation   | Template overlay via Figma coordinate mapping    |
| PDF Merging      | `pdf-lib` (or equivalent)                        |
| Weather Data     | National Weather Service API                     |
| Hosting          | Vercel                                           |
| Version Control  | GitHub                                           |

---

## Architecture: Shared Data Model

This is the **single most important concept** in the codebase. Get this right, everything else follows.

Two categories of data:

### Shared Operational-Period Data (entered once, reused everywhere)
- Incident name, incident number, operational period number
- Operational period start/end date and time
- Incident Commander
- Prepared by (name + title), Approved by (name)
- Agency/organization name, agency logo

### Form-Specific Data (local to one form)
- ICS 202 objectives, ICS 203 assignments, ICS 204 tactical assignments,
  ICS 205 radio channels, ICS 205A comms contacts, ICS 206 medical info,
  ICS 207 org chart, ICS 208 safety messages, weather document

### Sync Rules (non-negotiable)
1. Shared fields update across all relevant forms automatically.
2. Users never manually copy shared values from page to page.
3. If a shared field changes, related forms and exports reflect the new value.
4. Generated PDFs always pull the latest saved shared data.
5. Form-specific data stays local to its form.

---

## ICS Forms in MVP Scope

| Form     | Purpose                              | Sprint |
| -------- | ------------------------------------ | ------ |
| ICS 202  | Incident Objectives                  | S2     |
| ICS 203  | Organization Assignment List         | S2     |
| ICS 204  | Assignment List                      | S3     |
| ICS 205  | Incident Radio Communications Plan   | S3     |
| ICS 205A | Communications List                  | S3     |
| ICS 206  | Medical Plan                         | S3     |
| ICS 207  | Incident Organization Chart          | S4     |
| ICS 208  | Safety Message / Plan                | S4     |

Every form page must:
- Display structured fields matching the standard ICS layout
- Save data tied to the current incident + operational period
- Load saved data on reopen
- Auto-populate shared data (no manual re-entry)
- Validate required fields before export
- Support individual PDF export via coordinate-mapped overlay

---

## Sprint Plan (Quick Reference)

| Sprint | Focus                                                   | Detail                          |
| ------ | ------------------------------------------------------- | ------------------------------- |
| S1     | Setup, Auth, Incidents, Shared Data Model               | `docs/sprints/sprint-1.md`      |
| S2     | Profile, Logo, Workspace Nav, ICS 202 & 203             | `docs/sprints/sprint-2.md`      |
| S3     | ICS 204, 205, 205A & 206                                | `docs/sprints/sprint-3.md`      |
| S4     | ICS 207 & 208, PDF Engine, Individual Export            | `docs/sprints/sprint-4.md`      |
| S5     | Cover Page, Weather Integration, Combined IAP Export    | `docs/sprints/sprint-5.md`      |
| S6     | IAP Assembly Page, Polish & QA                          | `docs/sprints/sprint-6.md`      |

**Before working on any sprint, read its sprint file.** That file contains the full deliverables, success criteria, and progress log for the sprint.

---

## IAP Assembly Order (for Combined Export)

1. IAP Cover Page
2. ICS 202 — Incident Objectives
3. ICS 203 — Organization Assignment List
4. ICS 204 — Assignment List
5. ICS 205 — Incident Radio Communications Plan
6. ICS 205A — Communications List
7. ICS 206 — Medical Plan
8. ICS 207 — Incident Organization Chart
9. ICS 208 — Safety Message / Plan
10. Weather PDF (if attached)

---

## Out of Scope (Do Not Build)

These are explicitly excluded from MVP. If the user asks for them, flag it as a change order:

- Full GIS mapping
- CAD integration
- Offline mode
- Complex approval chains or role-based permissions
- Messaging or notification system
- Public portal
- Reimbursement tracking
- Advanced analytics or reporting
- Mobile-native application
- Multi-user collaboration or simultaneous editing
- Multi-language support

---

## Coding Conventions

- **Language:** TypeScript everywhere. No plain `.js` files in `src/`.
- **Components:** Functional React components with hooks. One component per file.
- **File naming:** `kebab-case` for files, `PascalCase` for component exports.
- **Imports:** Absolute imports via `@/` alias (configured in `tsconfig.json`).
- **API routes:** Validate input with `zod`. Return typed responses.
- **Database access:** All Supabase calls go through `lib/supabase/` helpers — no direct client calls in components.
- **Forms:** Use a single form library consistently (recommend `react-hook-form` + `zod`).
- **Styling:** Tailwind CSS. No inline styles, no styled-components.
- **Errors:** Never swallow errors silently. Log to console in dev, surface to user with toast/alert.
- **Secrets:** Never commit `.env.local`. Document required env vars in `.env.example`.

---

## Branching & Commits

- `main` — production (auto-deploys to Vercel)
- `dev` — integration branch
- `sprint-N/feature-name` — feature branches per sprint
- Conventional commits: `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`
- Merge to `dev` via PR. Merge to `main` only at sprint completion after client approval.

---

## Session Protocol (READ THIS EVERY SESSION)

This is the most important section. Follow it strictly.

### At the START of every session

1. Read this file (`CLAUDE.md`) in full.
2. Read `PROGRESS.md` to see what was done in previous sessions.
3. Read the **current sprint file** (`docs/sprints/sprint-N.md`) — focus on the "Progress Log" and "Open Items" sections.
4. Confirm with the user: "We're in Sprint N, working on [X]. Last session ended with [Y]. Today's focus is [Z] — correct?"

### DURING the session

- Stay within the **current sprint's scope**. If a task feels like it belongs to a later sprint or is out-of-scope, flag it before doing it.
- If the user asks for something not covered by the contract, explicitly say: "This looks like a change order — should I proceed or wait for written approval?"
- Keep notes as you work — what you tried, what worked, what didn't, decisions made and why.

### At the END of every session

This is non-negotiable. Before the session ends, **always update**:

1. **`PROGRESS.md`** — append a new session entry (template below). Date, what was done, what's next, any blockers.
2. **The current sprint file** (`docs/sprints/sprint-N.md`):
   - Tick completed deliverables in the checklist.
   - Update the "Progress Log" with today's work.
   - Update "Open Items" with anything left.
   - If a success criterion is met, mark it done.
3. **`CLAUDE.md` (this file)** — only update if a project-wide decision changed (new convention, new dependency, architectural shift). Don't update for routine work.

If the user ends the session abruptly, do this update as the final action before stopping.

### Session log entry template (for `PROGRESS.md`)

```markdown
## YYYY-MM-DD — Sprint N, Session [number or short title]

**Worked on:** [1–2 sentence summary]

**Completed:**
- [bullet]
- [bullet]

**In progress:**
- [bullet — what state is it in? what's the next concrete step?]

**Decisions made:**
- [bullet — and why]

**Blockers / open questions:**
- [bullet — who needs to answer? client? developer?]

**Next session should start with:**
- [concrete first task]
```

---

## Client Communication

- **Primary channel:** Upwork messaging (formal updates, approvals, change orders).
- **Code:** GitHub PRs and Issues.
- **Sprint reviews:** End of each sprint — demo + walkthrough before payment release.
- **Client SLA:** 3 business days to review; 5 business days of silence = auto-approval.
- **Change orders:** Require written approval via Upwork **before work begins**. Never start unscoped work on assumption.

---

## Warranty & Support

- **60-day bug-fix warranty** post-final-sprint covers: critical bugs, deployment issues, security vulnerabilities, MVP-scope issues found in initial use.
- **Not covered:** third-party outages (Supabase/NWS/Vercel), feature requests, client-side modifications, hosting maintenance.
- After 60 days: change orders or monthly retainer.

---

## Definition of Done (per sprint)

A sprint is "done" when **all** of these are true:

- [ ] All deliverables in the sprint file are checked off.
- [ ] All success criteria in the sprint file pass manual testing.
- [ ] Code is merged to `dev` and deployed to a Vercel preview.
- [ ] No critical bugs open against sprint scope.
- [ ] Sprint file's "Progress Log" reflects what was actually built.
- [ ] `PROGRESS.md` has a final entry summarizing the sprint.
- [ ] Demo recorded or walkthrough scheduled with client.

Only then notify the client and request payment release.
