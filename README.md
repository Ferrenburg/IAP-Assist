# OpPeriod IAP Assist

A web app for public safety agencies to author and export Incident Action Plans (IAPs). Original Figma design: https://www.figma.com/design/gwoYwMBQHs3jVgvblCtCxH/OpPeriod-IAP-Assist.

For full project context (architecture, conventions, sprint protocol) see [CLAUDE.md](CLAUDE.md).

## Stack

Next.js 15 (App Router) · React 18 · TypeScript · Tailwind CSS v4 · Supabase (Postgres + Auth + Edge Functions) · pnpm.

## Local development

1. Install dependencies:
   ```
   pnpm install
   ```

2. Configure environment variables:
   ```
   cp .env.example .env.local
   ```
   Then edit `.env.local` and fill in the two Supabase values. Get them from
   `https://supabase.com/dashboard/project/<your-project-id>/settings/api-keys`:
   - `NEXT_PUBLIC_SUPABASE_PROJECT_ID` — the project ref
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` — the new publishable key (`sb_publishable_...`).
     This replaces the legacy "anon" key. Never use the secret key (`sb_secret_...`) here.

3. Run the dev server:
   ```
   pnpm dev
   ```
   Open http://localhost:3000.

`pnpm build` produces a production build. `pnpm start` serves it.

## Deploy

Hosted on Vercel — `main` auto-deploys to production, all other branches get preview URLs. After importing the GitHub repo into Vercel, set the same two env vars (`NEXT_PUBLIC_SUPABASE_PROJECT_ID`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`) under **Project Settings → Environment Variables** for both Preview and Production scopes.

## Backend

The Supabase Edge Function lives in [supabase/functions/server/](supabase/functions/server/). Deploy it via the Supabase CLI:
```
supabase functions deploy server --no-verify-jwt
```
The `--no-verify-jwt` flag is required because Supabase's new publishable/secret keys cannot be sent in the `Authorization: Bearer` header — the Edge Function does its own JWT verification using `supabase.auth.getUser(token)` instead. Vercel only hosts the Next.js frontend; the Edge Function deploys to Supabase.

## Schema

Database schema is documented in [SCHEMA.md](SCHEMA.md).
