-- Ensure photo bucket exists and allow web app to use it

-- 1) Create bucket if it does not exist
insert into storage.buckets (id, name, public)
values ('photo', 'photo', false)
on conflict (id) do nothing;

-- 2) Basic RLS policies for private profile photos
-- Allow anyone (anon/authenticated) to read objects from photo
do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Allow public read on photo bucket'
  ) then
    create policy "Allow public read on photo bucket"
      on storage.objects
      for select
      to anon, authenticated
      using (bucket_id = 'photo');
  end if;
end $$;

-- Allow anon/authenticated to insert into photo
do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Allow uploads to photo for anon and authenticated'
  ) then
    create policy "Allow uploads to photo for anon and authenticated"
      on storage.objects
      for insert
      to anon, authenticated
      with check (bucket_id = 'photo');
  end if;
end $$;

