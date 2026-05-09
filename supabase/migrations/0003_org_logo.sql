-- Add logo_url to organizations so the agency logo is stored once at the org level.
-- The PDF generator and shared-data loader fall back to this URL when
-- op_period_shared_data.agency_logo_url is null for a given period.
-- Idempotent.

alter table public.organizations
  add column if not exists logo_url text;
