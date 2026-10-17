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

## Tech stack

| Layer            | Tech                                                           |
| ---------------- | -------------------------------------------------------------- |
| Framework        | Next.js 15 (App Router)                                        |
| React            | 18.3.1                                                         |
| Language         | TypeScript                                                     |
| Styling          | Tailwind CSS v4 via `@tailwindcss/postcss`                     |
| UI primitives    | Radix UI + shadcn/ui (~50 wrappers in `src/app/components/ui/`) |
| Forms            | React Hook Form                                                |
| Backend          | Supabase (Postgres, Auth, Storage) + Edge Functions            |
| PDF              | `pdf-lib` (overlay/merge), `jspdf` + `jspdf-autotable`, `pdf-parse` |
| Misc             | `motion`, `recharts`, `react-dnd`, `sonner` (toasts), `lucide-react` |
| Package manager  | pnpm                                                           |

The repo was migrated from Vite + React Router to Next.js App Router. There is **no** ESLint, Prettier, or test runner. [next.config.mjs](next.config.mjs) currently sets `typescript.ignoreBuildErrors: true` and `eslint.ignoreDuringBuilds: true` because the codebase has never been type-checked — turn these off as types get fixed.

---

## Commands

```bash
pnpm install        # install deps
pnpm dev            # next dev — http://localhost:3000
pnpm build          # next build — production build to .next/
pnpm start          # next start — serve the production build
```

---

## Directory map

Two top-level code roots — `app/` (Next routes) and `src/` (everything else, aliased as `@/`).

```
app/                                # Next App Router — routing only, thin re-export pages
  layout.tsx                        # root <html>/<body> + Providers
  providers.tsx                     # 'use client' — wraps ThemeProvider + AuthProvider + <Toaster/>
  globals.css                       # imports src/styles/{fonts,tailwind,theme}.css
  page.tsx                          # / — auth-aware (Homepage if !user, MainWorkspace if user)
  not-found.tsx                     # 404 fallback
  pricing/page.tsx                  # public, redirects to / if logged in
  login/page.tsx                    # public, redirects to / if logged in
  admin/page.tsx                    # auth-only via <AuthGate>
  account-settings/page.tsx         # auth-only
  (fullheight)/                     # route group — shares full-height workspace layout
    layout.tsx                      # AuthGate + IAPWorkspaceLayout fullHeight
    team/page.tsx
    defaults/page.tsx
    templates/page.tsx
    utilities/page.tsx
  iap/[iapId]/period/[periodId]/    # the working-IAP segment
    layout.tsx                      # AuthGate + IAPWorkspaceLayout
    page.tsx                        # default = ObjectivesPage
    objectives/page.tsx
    personnel/page.tsx
    assignments/page.tsx
    communications/page.tsx
    safety-medical/page.tsx
    weather/page.tsx
    action-tracker/page.tsx
    iap-assembly/page.tsx

src/                                # @/ alias — all real component + utility code
  app/
    _components/auth-gate.tsx       # client-side auth redirect helper
    layouts/iap-workspace-layout.tsx
    pages/                          # actual page components (Homepage, MainWorkspace,
                                    # ObjectivesPage, AssignmentsPage, …)
    components/
      ui/                           # shadcn primitives (do not edit casually)
      sidebar.tsx, workspace-header.tsx
      figma/                        # Figma-generated components
  utils/
    api-client.ts                   # HTTP client for Supabase
    supabase-client.ts              # Supabase JS client init
    supabase-info.ts                # projectId + publishableKey from env vars
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
      pdf-asset-urls.ts             # imports template PDFs as ES modules
      debug-pdf-coords.ts           # dev-only coordinate debugging
  contexts/
    auth-context.tsx                # 'use client' — auth state, localStorage token
    theme-context.tsx               # 'use client' — light/dark/system, SSR-safe
    op-period-context.tsx           # 'use client' — shared op-period data (incident
                                    # name/number, period dates, IC, prepared by,
                                    # approved by, agency). Mounted in
                                    # app/iap/[iapId]/period/[periodId]/layout.tsx.
                                    # Use useOpPeriod() inside that segment;
                                    # useOpPeriodOptional() for the workspace
                                    # header which renders outside it too.
  hooks/use-autosave.ts
  constants/ics-positions.ts        # PDF coordinate constants
  styles/                           # tailwind.css, theme.css, fonts.css, index.css
  types/assets.d.ts                 # *.pdf, *.csv, *.svg module declarations
  assets/pdfs/                      # ICS template PDFs (one set, ICS202.pdf etc.)
  imports/                          # PDF templates used by pdf-generator-v2 +
                                    # Figma-generated PNGs (logos)

supabase/
  functions/server/
    index.ts                        # edge function handler (Hono)
    kv_store.ts                     # KV storage helpers
  migrations/
    0001_sprint1_schema.sql         # relational tables for incidents, periods, shared data

public/
  ics-templates/                    # PDF templates served at /ics-templates/...
                                    # (used at runtime by debug-pdf-coords.ts)
  OP_Logo.png, …
```

---

## Routing rules (App Router)

- Client-rendered SPA, just powered by Next. Every page in [app/](app/) opens with `'use client'`. The route file body is a thin component that imports the real page from `@/app/pages/...` and renders it.
- **Auth-gated routes** wrap themselves in `<AuthGate>` from [src/app/_components/auth-gate.tsx](src/app/_components/auth-gate.tsx). It redirects unauthenticated users to `/`. Used by `admin`, `account-settings`, the `(fullheight)` group, and the `iap/[iapId]/period/[periodId]` segment.
- **Public pages** (`/login`, `/pricing`) inline a `useEffect` redirect to `/` if `user` is set.
- **Path alias `@/`** maps to `src/`. Configured in [tsconfig.json](tsconfig.json) AND in [next.config.mjs](next.config.mjs) as an explicit `webpack.resolve.alias` — the explicit alias is required because the tsconfig path mysteriously fails to resolve from inside the `(fullheight)` route group. Don't remove it.
- **Hooks**: use `useRouter`, `usePathname`, `useParams` from `next/navigation`; use `Link` from `next/link` (`href=`, not `to=`).

---

## The shared-data model (non-negotiable)

This is the most important invariant in the codebase. **The implementation lives in [src/contexts/op-period-context.tsx](src/contexts/op-period-context.tsx).** The Incident Info workspace tab is the canonical editor; every other page consumes the context for shared fields and writes back via `update(patch)`.

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
- [src/utils/pdf-generator-v2.ts](src/utils/pdf-generator-v2.ts) loads templates via ES module imports of files in `src/imports/`. Webpack/Turbopack treat `.pdf` files as `asset/resource` (configured in [next.config.mjs](next.config.mjs)) and resolve them to bundled URLs at build time.
- For runtime-fetched templates (e.g. [src/utils/ics-forms/debug-pdf-coords.ts](src/utils/ics-forms/debug-pdf-coords.ts)), the URL `/ics-templates/...` is served by Next from [public/ics-templates/](public/ics-templates/).

---

## Conventions

- **Language:** TypeScript only. No `.js` files in `src/`.
- **Components:** Functional React with hooks, one component per file.
- **File names:** `kebab-case.ts(x)`. Component exports: `PascalCase`.
- **'use client' directive**: every interactive component (anything using state, effects, browser APIs, or user input) needs `'use client'` at the top. The root layout, providers, all `app/` route files, and most `src/app/pages/` components already have it.
- **Server components**: not currently used — there are no API routes or data-fetching server components. The whole app is client-rendered. If you start writing server components, watch out for hooks/`localStorage`/`window` references that would break SSR.
- **Supabase access:** route through [src/utils/api-client.ts](src/utils/api-client.ts) and [src/utils/supabase-client.ts](src/utils/supabase-client.ts). Don't call the Supabase client directly from components.
- **Forms:** React Hook Form. Validate inputs (zod is the recommended schema lib if added).
- **Styling:** Tailwind only. No inline styles. No styled-components or Emotion-as-a-styling-engine for new code.
- **PDF:** Use `pdf-generator-v2.ts`. The older `pdf-generator.ts` is legacy and should not be extended.
- **Errors:** Don't swallow them. Log in dev, surface to users with a Sonner toast.
- **Env:** Never commit `.env*` files with secrets. Document required vars in `.env.example` if you add any.

---

## Branching

- `main` — production (auto-deploys to Vercel)
- `dev` — integration branch
- `sprint-N/feature-name` — feature branches per sprint
- Conventional commits: `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`
- PR into `dev`. Merge to `main` only at sprint completion after client approval.

---

## ⚠️ Things to know before you touch anything

1. **Supabase keys come from env vars.** [src/utils/supabase-info.ts](src/utils/supabase-info.ts) reads `NEXT_PUBLIC_SUPABASE_PROJECT_ID` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (the new `sb_publishable_...` key, NOT the legacy anon JWT). It throws at module load if either is missing — so a missing `.env.local` will surface as a clear error rather than a silent 401. Set them locally per [.env.example](.env.example) and in Vercel project settings for both Preview and Production. The publishable key goes in the `apikey` HTTP header (not `Authorization`); see [src/utils/api-client.ts](src/utils/api-client.ts) for the pattern. Edge Function deploys use `supabase functions deploy server --no-verify-jwt` because the new keys can't ride in `Authorization: Bearer`.
2. **Build errors are silenced.** [next.config.mjs](next.config.mjs) sets `typescript.ignoreBuildErrors: true` and `eslint.ignoreDuringBuilds: true`. Disable these as you fix types — they exist to unblock the migration, not as a permanent config.
3. **Two PDF generators.** Use `pdf-generator-v2.ts`. `pdf-generator.ts` is legacy.
4. **Shared data must not be cached per-form.** Forms refetch the live op-period record on navigation, so a change on one page is visible on the next.
5. **Weather (NWS API) is US-only and rate-limited.** The IAP export must degrade gracefully when weather is unavailable — never block export on a weather failure.
6. **No test suite.** Verification is manual: `pnpm dev`, click through the page being changed, export a PDF, eyeball the result.
7. **`(fullheight)` route group + `@/` alias quirk.** The `@/*` tsconfig path resolves correctly from every route folder *except* the `(fullheight)` route group, for unknown reasons. The explicit `webpack.resolve.alias` in [next.config.mjs](next.config.mjs) is the workaround. Don't remove it.

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

Note: the planning docs in [claude/](claude/) were originally written for a Next.js architecture, then drifted while the project temporarily ran on Vite. The repo is now Next.js again so the planning docs are largely accurate, but they pre-date the App Router migration so any references to `pages/api` or React Router patterns should be read as historical, not current.

---

## Key file references

- [claude/CLAUDE.md](claude/CLAUDE.md) — full product context, sprint protocol, contract terms
- [claude/PROGRESS.md](claude/PROGRESS.md) — session log
- [claude/sprint-1.md](claude/sprint-1.md) … [claude/sprint-6.md](claude/sprint-6.md) — per-sprint deliverables
- [src/utils/ics-forms/field-mappings.ts](src/utils/ics-forms/field-mappings.ts) — PDF field coordinates (most-edited file)
- [src/utils/pdf-generator-v2.ts](src/utils/pdf-generator-v2.ts) — current PDF engine
- [src/utils/pdf-combiner.ts](src/utils/pdf-combiner.ts) — combined IAP merger
- [src/utils/supabase-info.ts](src/utils/supabase-info.ts) — Supabase project credentials (anon key currently placeholder)
- [next.config.mjs](next.config.mjs) — Next config: webpack alias, asset rules, build-error suppression
- [QUICK_START_GUIDE.md](QUICK_START_GUIDE.md) — fast PDF-position adjustment guide
- [HOW_TO_ADJUST_PDF_POSITIONS.md](HOW_TO_ADJUST_PDF_POSITIONS.md) — full PDF coordinate guide
