# Environment & Deployment

---

## Required environment variables

These must be set in `.env.local` for local development and in Vercel project settings for preview/production.

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_PROJECT_ID` | Your Supabase project ID (found in Project Settings → General → Reference ID) |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | The new `sb_publishable_...` key (Project Settings → API → Project API keys → **Publishable**) |

> **Do not use the legacy anon JWT.** The app uses the new `sb_publishable_*` key format. The key is sent in the `apikey` HTTP header to the edge function, not in `Authorization: Bearer`.

### Example `.env.local`

```
NEXT_PUBLIC_SUPABASE_PROJECT_ID=your-project-ref
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

The `.env.example` file in the repo root documents these same vars.

---

## Supabase setup checklist

Complete these steps in order for a fresh deployment:

### 1. Create the Supabase project

1. Log in at `https://app.supabase.com` and create a new project.
2. Wait for the database to spin up.

### 2. Apply database migrations

1. Go to **SQL Editor** in your Supabase project.
2. Run `supabase/migrations/0001_sprint1_schema.sql`.
3. Run `supabase/migrations/0003_org_logo.sql`.

Both files are idempotent — safe to re-run if you're unsure.

### 3. Create the KV store table

The KV table is not in the migrations (it was created ad-hoc). Run this SQL in the Studio:

```sql
create table if not exists public.kv_store_897e0759 (
  id         uuid        primary key default gen_random_uuid(),
  iap_id     text        not null,
  key        text        not null,
  data       jsonb       not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (iap_id, key)
);
```

### 4. Create the Storage bucket

1. Go to **Storage** in Supabase Studio.
2. Click **New Bucket**.
3. Name it `agency-logos`.
4. Leave it as **Private**.

### 5. Deploy the edge function

```bash
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase functions deploy server --no-verify-jwt
```

The `--no-verify-jwt` flag is required because the new publishable key cannot be validated as a JWT by the edge function runtime.

### 6. Note the service-role key

The edge function needs the service-role key to bypass RLS. It must be set as a secret:

```bash
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

---

## Local development

```bash
pnpm install
cp .env.example .env.local
# fill in the two NEXT_PUBLIC_* vars in .env.local
pnpm dev
```

The app runs at `http://localhost:3000`.

There is no local Supabase emulator setup — the app points at the cloud Supabase project during local development as well.

---

## Vercel deployment

### First deploy

1. Push the repo to GitHub.
2. Go to `https://vercel.com` → **Add New Project** → import the GitHub repo.
3. Vercel auto-detects Next.js. Leave the build settings as-is.
4. Add environment variables under **Settings → Environment Variables**:
   - `NEXT_PUBLIC_SUPABASE_PROJECT_ID`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   - Set them for both **Preview** and **Production** environments.
5. Click **Deploy**.

### Subsequent deploys

Pushing to `main` triggers an automatic production deploy. Pushing to `dev` or any other branch triggers a preview deploy.

### Build notes

- `next.config.mjs` sets `typescript.ignoreBuildErrors: true` and `eslint.ignoreDuringBuilds: true` — these were left on to unblock the migration. Disable them progressively as types get fixed.
- Webpack is configured to treat `.pdf` files as `asset/resource` (for embedded PDF templates). This is required and must not be removed.
- The `@/` alias is configured both in `tsconfig.json` AND as an explicit `webpack.resolve.alias` in `next.config.mjs`. Both are needed — the tsconfig alias alone fails to resolve from inside the `(fullheight)` route group.

---

## Cross-browser notes

The app was developed and tested primarily in Chrome. Known considerations:

- **PDF download** — uses `URL.createObjectURL` + a programmatic `<a>` click. Works in all modern browsers.
- **Weather API** — NWS API is US-only. For non-US coordinates, the fetch will 404; the app shows a toast and degrades gracefully.
- **LocalStorage** — used for auth token (`access_token`) and weather location cache. Available in all modern browsers.
- No polyfills are needed for the target audience (public-safety agency desktops running Chrome/Edge/Firefox).

---

## ICS 207 coordinate calibration (post-deploy QA step)

The PDF coordinate positions for ICS 207 were set as estimates and have not been visually confirmed. After deployment:

1. Create a test incident and operational period.
2. Enter personnel on the Personnel page.
3. On the IAP Assembly page, select only ICS 207 and click **Generate IAP**.
4. Open the downloaded PDF and compare each name against the pre-printed box it should occupy.
5. If any names are misaligned, adjust the coordinates in `src/utils/ics-forms/field-mappings.ts` → `ICS_207_BLOCKS.orgChart`.

The coordinate system is bottom-left origin. Increase `x` to move right; increase `y` to move up. Re-generate after each adjustment until all eight positions look correct.
