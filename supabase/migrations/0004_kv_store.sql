-- KV store table used by the Supabase edge function for form-specific data
-- (objectives, assignments, communications, medical, safety, etc.) that hasn't
-- been normalized to relational tables yet. Required for the generic data routes
-- POST/PUT/DELETE /iaps/:iapId/:dataType to function.
-- Idempotent.

create table if not exists public.kv_store_897e0759 (
  key   text  not null primary key,
  value jsonb not null
);

-- Enable RLS (service-role key bypasses it; direct PostgREST access is blocked).
alter table public.kv_store_897e0759 enable row level security;
