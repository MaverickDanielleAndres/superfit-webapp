-- Description: Add storage bucket and policies for profile avatar uploads
-- Author: Copilot
-- Date: 2026-04-04

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'profile-avatars',
  'profile-avatars',
  true,
  3145728,
  array['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public read profile avatars" on storage.objects;
create policy "Public read profile avatars"
  on storage.objects
  for select
  using (bucket_id = 'profile-avatars');

drop policy if exists "Users upload own profile avatars" on storage.objects;
create policy "Users upload own profile avatars"
  on storage.objects
  for insert
  with check (
    bucket_id = 'profile-avatars'
    and auth.uid()::text = split_part(name, '/', 1)
  );

drop policy if exists "Users update own profile avatars" on storage.objects;
create policy "Users update own profile avatars"
  on storage.objects
  for update
  using (
    bucket_id = 'profile-avatars'
    and auth.uid()::text = split_part(name, '/', 1)
  )
  with check (
    bucket_id = 'profile-avatars'
    and auth.uid()::text = split_part(name, '/', 1)
  );

drop policy if exists "Users delete own profile avatars" on storage.objects;
create policy "Users delete own profile avatars"
  on storage.objects
  for delete
  using (
    bucket_id = 'profile-avatars'
    and auth.uid()::text = split_part(name, '/', 1)
  );
