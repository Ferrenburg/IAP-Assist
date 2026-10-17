-- Allow org members to update their own organization (name, logo_url) directly
-- from the client. Previously only the edge function (service role) could write
-- to organizations. Account Settings now goes client-side, so we need this.

drop policy if exists org_update_member on public.organizations;
create policy org_update_member on public.organizations
  for update using (public.is_org_member(auth.uid(), id))
  with check (public.is_org_member(auth.uid(), id));

-- Storage: agency-logos bucket + policies.
-- The edge function creates the bucket on first upload; this ensures it exists
-- and is public even if the edge function was never called.
insert into storage.buckets (id, name, public)
values ('agency-logos', 'agency-logos', true)
on conflict (id) do update set public = true;

-- Public read (logos appear on PDFs and cover pages).
drop policy if exists agency_logos_read on storage.objects;
create policy agency_logos_read on storage.objects
  for select using (bucket_id = 'agency-logos');

-- Authenticated users can upload / replace their org logo.
drop policy if exists agency_logos_insert on storage.objects;
create policy agency_logos_insert on storage.objects
  for insert with check (
    bucket_id = 'agency-logos' and auth.role() = 'authenticated'
  );

drop policy if exists agency_logos_update on storage.objects;
create policy agency_logos_update on storage.objects
  for update using (
    bucket_id = 'agency-logos' and auth.role() = 'authenticated'
  );
