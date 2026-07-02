-- Public `videos` bucket + RLS so the browser can upload directly. With no user
-- accounts yet, uploads run as `anon`; locking this behind auth is the next step.
-- Guarded on the `storage` schema so it no-ops on the PGlite test DB.
do $$
begin
  if not exists (
    select 1 from information_schema.schemata where schema_name = 'storage'
  ) then
    return;
  end if;

  -- file_size_limit mirrors MAX_UPLOAD_BYTES (lib/storage/paths.ts).
  insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  values (
    'videos', 'videos', true,
    10737418240, -- 10 GB
    array['video/mp4', 'video/quicktime', 'video/webm']
  )
  on conflict (id) do update set
    public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

  drop policy if exists "anon_insert_videos" on storage.objects;
  create policy "anon_insert_videos" on storage.objects
    for insert to anon with check (bucket_id = 'videos');

  -- Needed for TUS upserts (re-upload overwrites the same object in place).
  drop policy if exists "anon_update_videos" on storage.objects;
  create policy "anon_update_videos" on storage.objects
    for update to anon using (bucket_id = 'videos') with check (bucket_id = 'videos');

  -- Lets the resumable client resolve an in-progress upload's offset.
  drop policy if exists "anon_select_videos" on storage.objects;
  create policy "anon_select_videos" on storage.objects
    for select to anon using (bucket_id = 'videos');
end $$;
