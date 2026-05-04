// Supabase project config, sourced from environment variables.
// Set these in `.env.local` for local dev and in your Vercel project settings.
// See `.env.example` for the required keys; see README.md for setup steps.
//
// `publishableKey` is the new sb_publishable_... key that replaces the legacy
// anon JWT key. It is safe to ship in client code. The secret key (sb_secret_...)
// is server-only and never imported here.

const projectIdEnv = process.env.NEXT_PUBLIC_SUPABASE_PROJECT_ID;
const publishableKeyEnv = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!projectIdEnv) {
  throw new Error(
    'NEXT_PUBLIC_SUPABASE_PROJECT_ID is not set. Add it to .env.local (see .env.example).',
  );
}

if (!publishableKeyEnv) {
  throw new Error(
    'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY is not set. Add it to .env.local (see .env.example).',
  );
}

export const projectId: string = projectIdEnv;
export const publishableKey: string = publishableKeyEnv;
