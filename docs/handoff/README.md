# OpPeriod IAP Assist — Handoff Overview

This folder contains the complete technical handoff for the OpPeriod MVP. Read this file first, then the others in order.

---

## What was built

**OpPeriod IAP Assist** is a SaaS web application for public-safety agencies to author and export Incident Action Plan (IAP) documents for a single operational period. The core product principle is **shared data synchronization**: common data is entered once and automatically populates every ICS form and every PDF export.

### Key capabilities

- Create and manage incidents with one or more operational periods
- Enter shared op-period data (incident name, IC, agency, dates) a single time; all forms read from it
- Fill out eight ICS forms: 202, 203, 204, 205, 205A, 206, 207, 208
- Fetch weather data from the National Weather Service API and attach a formatted weather PDF
- Upload an agency logo once (Account Settings); it appears on every export
- Generate individual form PDFs and a combined IAP packet from the IAP Assembly page
- Email/password authentication with per-organization data isolation

---

## Tech stack

| Layer       | Technology                                    |
|-------------|-----------------------------------------------|
| Framework   | Next.js 15 (App Router, client-rendered SPA)  |
| Language    | TypeScript                                    |
| Styling     | Tailwind CSS v4                               |
| UI          | Radix UI + shadcn/ui                          |
| Backend     | Supabase (Postgres, Auth, Storage) + Hono edge function |
| PDF         | `pdf-lib` (cover page + merge), custom per-form generators |
| Weather     | National Weather Service API (US only)        |
| Hosting     | Vercel                                        |

---

## Repository structure (quick map)

```
app/                        Next.js App Router — thin route files only
src/
  app/
    pages/                  Real page components (imported by app/ routes)
    components/             Sidebar, header, shared UI
    _components/            auth-gate.tsx
    layouts/                iap-workspace-layout.tsx
  contexts/
    op-period-context.tsx   Shared op-period state (THE most important file)
    auth-context.tsx
    theme-context.tsx
  utils/
    api-client.ts           All HTTP calls to the edge function
    ics-forms/
      field-mappings.ts     PDF coordinate constants — most-edited file
      form-generator.ts     Per-form PDF generators (ICS 202–208)
      generators/           Individual form overrides (weather-pdf.ts, ics-202.ts)
    pdf-combiner.ts         Combined IAP merger
supabase/
  functions/server/         Hono edge function (all server-side logic)
  migrations/               SQL migrations (apply in Supabase Studio)
docs/handoff/               This folder — handoff documentation
```

---

## Documents in this folder

| File | Contents |
|------|----------|
| `README.md` | This file — overview and orientation |
| `database-setup.md` | Schema tables, KV store pattern, migrations |
| `environment-and-deployment.md` | Env vars, Supabase config, Vercel deploy, Storage buckets |
| `api-reference.md` | Edge function endpoints and data contracts |

---

## Warranty

A 60-day bug-fix warranty covers: critical bugs, deployment issues, security vulnerabilities, and MVP-scope issues found in initial use. It does **not** cover third-party outages (Supabase / NWS / Vercel), feature requests, client-side modifications, or hosting maintenance.
