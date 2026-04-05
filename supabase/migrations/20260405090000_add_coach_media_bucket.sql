-- Description: Add storage bucket and policies for coach content and broadcast media uploads
-- Author: Copilot
-- Date: 2026-04-05

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'coach-media',
  'coach-media',
  true,
  26214400,
  array[
    'image/png',
    'image/jpeg',
    'image/jpg',
    'image/webp',
    'video/mp4',
    'video/webm',
    'video/quicktime'
  ]
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public read coach media" on storage.objects;
create policy "Public read coach media"
  on storage.objects
  for select
  using (bucket_id = 'coach-media');

drop policy if exists "Coaches upload own media" on storage.objects;
create policy "Coaches upload own media"
  on storage.objects
  for insert
  with check (
    bucket_id = 'coach-media'
    and auth.uid()::text = split_part(name, '/', 1)
  );

drop policy if exists "Coaches update own media" on storage.objects;
create policy "Coaches update own media"
  on storage.objects
  for update
  using (
    bucket_id = 'coach-media'
    and auth.uid()::text = split_part(name, '/', 1)
  )
  with check (
    bucket_id = 'coach-media'
    and auth.uid()::text = split_part(name, '/', 1)
  );

drop policy if exists "Coaches delete own media" on storage.objects;
create policy "Coaches delete own media"
  on storage.objects
  for delete
  using (
    bucket_id = 'coach-media'
    and auth.uid()::text = split_part(name, '/', 1)
  );