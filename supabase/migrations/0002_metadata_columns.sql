-- Add metadata JSONB columns to incidents and operational_periods so the
-- existing UI (which sends extra Figma-Make-era fields like incidentType,
-- jurisdiction, location, description, completionPercent, etc.) can keep
-- writing without losing data while the schema stays narrow. Each sprint
-- can promote a metadata key to a real column when it normalizes a form.
-- Idempotent.

alter table public.incidents
  add column if not exists metadata jsonb not null default '{}'::jsonb;

alter table public.operational_periods
  add column if not exists metadata jsonb not null default '{}'::jsonb;
