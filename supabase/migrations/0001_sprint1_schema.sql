-- Sprint 1 schema: organizations, incidents, operational periods, shared data, form stubs.
-- Apply via Supabase Studio → SQL Editor (or via the Supabase CLI: `supabase db push`).
-- Idempotent: safe to re-run.

-- pgcrypto is needed for gen_random_uuid(). Available by default on Supabase.
create extension if not exists pgcrypto;

-- =============================================================================
-- organizations
-- =============================================================================
create table if not exists public.organizations (
  id          uuid        primary key default gen_random_uuid(),
  name        text        not null,
  created_at  timestamptz not null default now()
);

-- =============================================================================
-- org_members — links auth.users to organizations
-- =============================================================================
create table if not exists public.org_members (
  user_id     uuid        not null references auth.users(id) on delete cascade,
  org_id      uuid        not null references public.organizations(id) on delete cascade,
  role        text        not null default 'member' check (role in ('owner', 'admin', 'member')),
  joined_at   timestamptz not null default now(),
  primary key (user_id, org_id)
);

create index if not exists idx_org_members_org_id on public.org_members(org_id);

-- =============================================================================
-- incidents
-- =============================================================================
create table if not exists public.incidents (
  id          uuid        primary key default gen_random_uuid(),
  org_id      uuid        not null references public.organizations(id) on delete cascade,
  name        text        not null,
  number      text,
  created_by  uuid        not null references auth.users(id),
  created_at  timestamptz not null default now(),
  archived_at timestamptz
);

create index if not exists idx_incidents_org_id on public.incidents(org_id);
create index if not exists idx_incidents_archived on public.incidents(org_id, archived_at);

-- =============================================================================
-- operational_periods
-- =============================================================================
create table if not exists public.operational_periods (
  id            uuid        primary key default gen_random_uuid(),
  incident_id   uuid        not null references public.incidents(id) on delete cascade,
  period_number int         not null,
  start_at      timestamptz,
  end_at        timestamptz,
  status        text        not null default 'planned' check (status in ('planned', 'active', 'completed')),
  created_at    timestamptz not null default now(),
  unique (incident_id, period_number)
);

create index if not exists idx_op_periods_incident_id on public.operational_periods(incident_id);

-- =============================================================================
-- op_period_shared_data — the per-period overlay of shared fields.
-- (incident_name/number live on incidents; period_number/start/end live on
-- operational_periods. This table holds only the fields that don't fit either.)
-- =============================================================================
create table if not exists public.op_period_shared_data (
  period_id            uuid        primary key references public.operational_periods(id) on delete cascade,
  incident_commander   text,
  prepared_by_name     text,
  prepared_by_title    text,
  approved_by_name     text,
  agency_name          text,
  agency_logo_url      text,
  updated_at           timestamptz not null default now()
);

-- =============================================================================
-- form data stubs — one row per item, JSONB payload. Sprint 2+ will normalize.
-- =============================================================================
create table if not exists public.form_objectives (
  id          uuid        primary key default gen_random_uuid(),
  period_id   uuid        not null references public.operational_periods(id) on delete cascade,
  data        jsonb       not null default '{}'::jsonb,
  updated_at  timestamptz not null default now()
);
create index if not exists idx_form_objectives_period on public.form_objectives(period_id);

create table if not exists public.form_assignments (
  id          uuid        primary key default gen_random_uuid(),
  period_id   uuid        not null references public.operational_periods(id) on delete cascade,
  data        jsonb       not null default '{}'::jsonb,
  updated_at  timestamptz not null default now()
);
create index if not exists idx_form_assignments_period on public.form_assignments(period_id);

create table if not exists public.form_communications (
  id          uuid        primary key default gen_random_uuid(),
  period_id   uuid        not null references public.operational_periods(id) on delete cascade,
  data        jsonb       not null default '{}'::jsonb,
  updated_at  timestamptz not null default now()
);
create index if not exists idx_form_communications_period on public.form_communications(period_id);

create table if not exists public.form_personnel (
  id          uuid        primary key default gen_random_uuid(),
  period_id   uuid        not null references public.operational_periods(id) on delete cascade,
  data        jsonb       not null default '{}'::jsonb,
  updated_at  timestamptz not null default now()
);
create index if not exists idx_form_personnel_period on public.form_personnel(period_id);

create table if not exists public.form_safety_medical (
  id          uuid        primary key default gen_random_uuid(),
  period_id   uuid        not null references public.operational_periods(id) on delete cascade,
  data        jsonb       not null default '{}'::jsonb,
  updated_at  timestamptz not null default now()
);
create index if not exists idx_form_safety_medical_period on public.form_safety_medical(period_id);

-- =============================================================================
-- updated_at trigger helper + application
-- =============================================================================
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_set_updated_at on public.op_period_shared_data;
create trigger trg_set_updated_at before update on public.op_period_shared_data
  for each row execute function public.set_updated_at();

drop trigger if exists trg_set_updated_at on public.form_objectives;
create trigger trg_set_updated_at before update on public.form_objectives
  for each row execute function public.set_updated_at();

drop trigger if exists trg_set_updated_at on public.form_assignments;
create trigger trg_set_updated_at before update on public.form_assignments
  for each row execute function public.set_updated_at();

drop trigger if exists trg_set_updated_at on public.form_communications;
create trigger trg_set_updated_at before update on public.form_communications
  for each row execute function public.set_updated_at();

drop trigger if exists trg_set_updated_at on public.form_personnel;
create trigger trg_set_updated_at before update on public.form_personnel
  for each row execute function public.set_updated_at();

drop trigger if exists trg_set_updated_at on public.form_safety_medical;
create trigger trg_set_updated_at before update on public.form_safety_medical
  for each row execute function public.set_updated_at();

-- =============================================================================
-- Row-Level Security
-- All Sprint-1 tables are member-scoped: a user can read/write rows belonging
-- to organizations they're a member of. The Edge Function uses the service-role
-- key, which bypasses RLS, so server code is unaffected by these policies.
-- =============================================================================

alter table public.organizations         enable row level security;
alter table public.org_members           enable row level security;
alter table public.incidents             enable row level security;
alter table public.operational_periods   enable row level security;
alter table public.op_period_shared_data enable row level security;
alter table public.form_objectives       enable row level security;
alter table public.form_assignments      enable row level security;
alter table public.form_communications   enable row level security;
alter table public.form_personnel        enable row level security;
alter table public.form_safety_medical   enable row level security;

-- Helper: check whether a user belongs to an org. Usable in policies.
create or replace function public.is_org_member(p_user_id uuid, p_org_id uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1 from public.org_members
    where user_id = p_user_id and org_id = p_org_id
  );
$$;

-- organizations: members can read; nobody writes via PostgREST (server-only).
drop policy if exists org_select_member on public.organizations;
create policy org_select_member on public.organizations
  for select using (public.is_org_member(auth.uid(), id));

-- org_members: a user sees their own memberships and their fellow members.
drop policy if exists org_members_select on public.org_members;
create policy org_members_select on public.org_members
  for select using (
    user_id = auth.uid() or public.is_org_member(auth.uid(), org_id)
  );

-- incidents: full CRUD for org members. Writes are still typically done
-- server-side (service-role), but allow direct PostgREST as well for now.
drop policy if exists incidents_select on public.incidents;
create policy incidents_select on public.incidents
  for select using (public.is_org_member(auth.uid(), org_id));

drop policy if exists incidents_insert on public.incidents;
create policy incidents_insert on public.incidents
  for insert with check (public.is_org_member(auth.uid(), org_id));

drop policy if exists incidents_update on public.incidents;
create policy incidents_update on public.incidents
  for update using (public.is_org_member(auth.uid(), org_id));

drop policy if exists incidents_delete on public.incidents;
create policy incidents_delete on public.incidents
  for delete using (public.is_org_member(auth.uid(), org_id));

-- operational_periods: same scope as their parent incident.
drop policy if exists op_periods_all on public.operational_periods;
create policy op_periods_all on public.operational_periods
  for all using (
    exists (
      select 1 from public.incidents i
      where i.id = operational_periods.incident_id
        and public.is_org_member(auth.uid(), i.org_id)
    )
  );

-- op_period_shared_data: same scope as the parent period's incident.
drop policy if exists op_shared_all on public.op_period_shared_data;
create policy op_shared_all on public.op_period_shared_data
  for all using (
    exists (
      select 1 from public.operational_periods op
      join public.incidents i on i.id = op.incident_id
      where op.id = op_period_shared_data.period_id
        and public.is_org_member(auth.uid(), i.org_id)
    )
  );

-- form_* tables: same membership scope. Define a helper to keep policies tidy.
create or replace function public.user_can_access_period(p_period_id uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1 from public.operational_periods op
    join public.incidents i on i.id = op.incident_id
    where op.id = p_period_id
      and public.is_org_member(auth.uid(), i.org_id)
  );
$$;

drop policy if exists form_objectives_all on public.form_objectives;
create policy form_objectives_all on public.form_objectives
  for all using (public.user_can_access_period(period_id));

drop policy if exists form_assignments_all on public.form_assignments;
create policy form_assignments_all on public.form_assignments
  for all using (public.user_can_access_period(period_id));

drop policy if exists form_communications_all on public.form_communications;
create policy form_communications_all on public.form_communications
  for all using (public.user_can_access_period(period_id));

drop policy if exists form_personnel_all on public.form_personnel;
create policy form_personnel_all on public.form_personnel
  for all using (public.user_can_access_period(period_id));

drop policy if exists form_safety_medical_all on public.form_safety_medical;
create policy form_safety_medical_all on public.form_safety_medical
  for all using (public.user_can_access_period(period_id));
