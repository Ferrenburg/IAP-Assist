# CLAUDE.md — OpPeriod IAP Assist

Read this in full at the start of every session. It is the single source of project context for Claude Code.

---

## What this project is

**OpPeriod IAP Assist** is a SaaS web app for public safety agencies to author and export Incident Action Plan (IAP) documents for a single operational period. The core product principle is **shared data synchronization**: common operational-period data is entered once and automatically populates every ICS form and every export.

- **Client:** Samuel Ferrenburg / OpPeriod (Upwork)
- **Developer:** Hassan Amjad
- **Engagement:** 6 weekly sprints, $250/sprint ($1,500 total)
- **Hosting:** Vercel

---

## ⚠️ Stack reality vs. planning docs

The planning docs in [claude/](claude/) (especially [claude/CLAUDE.md](claude/CLAUDE.md)) describe the app as **Next.js with API routes**. The actual codebase is **Vite + React 18 + React Router v7** with Supabase Edge Functions for the backend. There are no Next.js pages, no `pages/api`, no Next.js conventions in `src/`. When the planning docs and the code disagree, **trust the code**. The planning docs are useful for product context (purpose, scope, shared-data rules, sprint protocol) — not architecture.

---

## Tech stack (verified from `package.json` and `vite.config.ts`)

| Layer            | Tech                                                           |
| ---------------- | -------------------------------------------------------------- |
| Frontend         | React 18.3.1 + TypeScript                                      |
| Bundler          | Vite 6.3.5 (`@vitejs/plugin-react`)                            |
| Routing          | React Router v7 (client-side)                                  |
| Styling          | Tailwind CSS v4 via `@tailwindcss/vite`                        |
| UI primitives    | Radix UI + shadcn/ui (~50 wrappers in `src/app/components/ui/`) |
| Forms            | React Hook Form                                                |
| Backend          | Supabase (Postgres, Auth, Storage) + Edge Functions            |
| PDF              | `pdf-lib` (overlay/merge), `jspdf` + `jspdf-autotable`, `pdf-parse` |
| Misc             | `motion`, `recharts`, `react-dnd`, `sonner` (toasts), `lucide-react` |
| Package manager  | pnpm                                                           |

There is currently **no** ESLint, Prettier, test runner, or `tsconfig.json` in the repo. Type-checking comes from Vite's React plugin at build time. Verification is manual smoke testing.

---

## Commands

```bash
pnpm install        # install deps
pnpm dev            # Vite dev server (HMR)
pnpm build          # production build to dist/
```

---

## Directory map

```
src/
  main.tsx                          # Vite entry → mounts <App/>
  app/
    App.tsx                         # router root
    layouts/iap-workspace-layout.tsx
    pages/                          # iap-assembly-page, assignments-page,
                                    # communications-page, action-tracker-page,
                                    # objectives-page, weather-page, admin, auth-page, …
    components/
      ui/                           # shadcn primitives (do not edit casually)
      sidebar.tsx, workspace-header.tsx, …
      figma/                        # Figma-generated components
  utils/
    api-client.ts                   # HTTP client for Supabase
    supabase-client.ts              # Supabase JS client init
    pdf-generator.ts                # ⚠ legacy — do not extend
    pdf-generator-v2.ts             # current PDF engine
    pdf-combiner.ts                 # merges per-form PDFs into the combined IAP
    phone-formatter.ts
    ics-forms/                      # the heart of the app
      field-mappings.ts             # field name → PDF coordinates (most-edited file)
      form-generator.ts             # core form/PDF orchestration
      field-validator.ts
      load-pdf-template.ts
      pdf-helpers.ts
      generators/                   # per-form generators (202, 203, …)
      debug-pdf-coords.ts           # dev-only coordinate debugging
  contexts/
    auth-context.tsx                # auth state
    theme-context.tsx               # light/dark mode (also see next-themes)
  hooks/use-autosave.ts
  constants/ics-positions.ts        # PDF coordinate constants
  styles/                           # tailwind.css, theme.css, fonts.css, index.css
  assets/                           # images, embedded PDFs
  imports/                          # Figma-generated assets

supabase/
  functions/server/
    index.tsx                       # edge function handler
    kv_store.tsx                    # KV storage helpers

public/
  ics-templates/                    # canonical ICS form PDFs (forms 202–208)
                                    # served at runtime URL /ics-templates/...
  OP_Logo.png, …
```

---

## The shared-data model (non-negotiable)

This is the most important invariant in the codebase.

**Shared op-period fields** (entered once, read by every form):
- Incident name, incident number, operational period number
- Op period start/end date and time
- Incident Commander
- Prepared by (name + title), Approved by (name)
- Agency / organization name, agency logo

**Form-specific fields** (local to one form's table only):
- 202 objectives, 203 assignments, 204 tactics, 205 radio channels,
  205A comms contacts, 206 medical, 207 org chart, 208 safety messages,
  weather document

**Sync rules:**
1. Forms update shared fields automatically across all relevant forms.
2. Users never manually copy shared values from page to page.
3. If a shared field changes, every form and export reflects the new value.
4. Generated PDFs always pull the latest saved shared data.
5. Form-specific data stays local — never write it onto the shared op-period record.
6. Forms read the live shared record on navigation. Don't cache it per-form.

---

## ICS forms in MVP scope

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

**Combined IAP export order:** Cover → 202 → 203 → 204 → 205 → 205A → 206 → 207 → 208 → Weather (if attached).

---

## PDF coordinate workflow

This is the most-edited workflow in the project.

- Field positions live in [src/utils/ics-forms/field-mappings.ts](src/utils/ics-forms/field-mappings.ts).
- To nudge a field: open that file, find the form (e.g. `ICS_202_BLOCKS`), edit `x`/`y` (PDF origin is bottom-left, so larger `y` = higher on the page), regenerate the PDF, repeat.
- Step-by-step guides: [QUICK_START_GUIDE.md](QUICK_START_GUIDE.md) and [HOW_TO_ADJUST_PDF_POSITIONS.md](HOW_TO_ADJUST_PDF_POSITIONS.md).
- Do not modify the per-form generators in [src/utils/ics-forms/generators/](src/utils/ics-forms/generators/) for visual tweaks — only `field-mappings.ts`.
- PDF templates are served at runtime from [public/ics-templates/](public/ics-templates/) via the URL path `/ics-templates/...`. Do not hardcode template paths into `src/`.

---

## Conventions

- **Language:** TypeScript only. No `.js` files in `src/`.
- **Components:** Functional React with hooks, one component per file.
- **File names:** `kebab-case.ts(x)`. Component exports: `PascalCase`.
- **Supabase access:** route through `src/utils/api-client.ts` and `src/utils/supabase-client.ts`. Don't call the Supabase client directly from components.
- **Forms:** React Hook Form. Validate inputs (zod is the recommended schema lib if added).
- **Styling:** Tailwind only. No inline styles. No styled-components or Emotion-as-a-styling-engine for new code.
- **PDF:** Use `pdf-generator-v2.ts`. The older `pdf-generator.ts` is legacy and should not be extended.
- **Errors:** Don't swallow them. Log in dev, surface to users with a Sonner toast.
- **Env:** Never commit `.env*` files with secrets. Document required vars in `.env.example` if you add any.

---

## Branching

- `main` — production (auto-deploys to Vercel)
- `develop` — integration branch
- `sprint-N/feature-name` — feature branches per sprint
- Conventional commits: `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`
- PR into `develop`. Merge to `main` only at sprint completion after client approval.

---

## Common gotchas

1. **Two PDF generators exist.** Use `pdf-generator-v2.ts`. `pdf-generator.ts` is legacy.
2. **PDF templates served from `public/`.** Code that loads templates fetches `/ics-templates/...`, which Vite serves from [public/ics-templates/](public/ics-templates/). Don't put templates in `src/` and don't reference root-level paths.
3. **Shared data must not be cached per-form.** Forms refetch the live op-period record on navigation, so a change on one page is visible on the next.
4. **Weather (NWS API) is US-only and rate-limited.** The IAP export must degrade gracefully when weather is unavailable — never block export on a weather failure.
5. **No test suite.** Verification is manual: `pnpm dev`, click through the page being changed, export a PDF, eyeball the result.
6. **Type errors only surface at build time.** Run `pnpm build` periodically to catch them.

---

## Out of scope for MVP

Flag these as change orders if requested — do not silently build them:

- GIS mapping, CAD integration, offline mode
- Complex approval chains or role-based permissions
- Messaging / notifications, public portal
- Reimbursement tracking, advanced analytics
- Mobile-native app
- Multi-user collaboration / simultaneous editing
- Multi-language support

---

## Sprint protocol

Sprint plans, deliverables, and per-session progress logs live in [claude/](claude/) — they change weekly and are not duplicated here.

**At session start:**
1. Read this file.
2. Read [claude/PROGRESS.md](claude/PROGRESS.md) for the latest session summary.
3. Read the current sprint file ([claude/sprint-1.md](claude/sprint-1.md) … [claude/sprint-6.md](claude/sprint-6.md)) — focus on its Progress Log and Open Items.
4. Confirm with the user: "We're in Sprint N, working on X. Last session ended with Y. Today's focus is Z — correct?"

**During the session:** Stay in the current sprint's scope. If a request feels out-of-scope, flag it as a possible change order before doing the work.

**At session end (non-negotiable):**
1. Append a session entry to [claude/PROGRESS.md](claude/PROGRESS.md) (template is in [claude/CLAUDE.md](claude/CLAUDE.md)).
2. Tick deliverables and update Progress Log + Open Items in the sprint file.
3. Update this CLAUDE.md only when a project-wide decision changed (new convention, new dependency, architectural shift) — not for routine work.

---

## Key file references

- [claude/CLAUDE.md](claude/CLAUDE.md) — full product context, sprint protocol, contract terms
- [claude/PROGRESS.md](claude/PROGRESS.md) — session log
- [claude/sprint-1.md](claude/sprint-1.md) … [claude/sprint-6.md](claude/sprint-6.md) — per-sprint deliverables
- [src/utils/ics-forms/field-mappings.ts](src/utils/ics-forms/field-mappings.ts) — PDF field coordinates (most-edited file)
- [src/utils/pdf-generator-v2.ts](src/utils/pdf-generator-v2.ts) — current PDF engine
- [src/utils/pdf-combiner.ts](src/utils/pdf-combiner.ts) — combined IAP merger
- [QUICK_START_GUIDE.md](QUICK_START_GUIDE.md) — fast PDF-position adjustment guide
- [HOW_TO_ADJUST_PDF_POSITIONS.md](HOW_TO_ADJUST_PDF_POSITIONS.md) — full PDF coordinate guide
