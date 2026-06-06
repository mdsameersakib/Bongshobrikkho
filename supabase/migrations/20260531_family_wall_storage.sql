-- Create a new storage bucket for family wall images
insert into storage.buckets (id, name, public)
values ('family-wall', 'family-wall', true)
on conflict (id) do nothing;

-- Set up RLS for the bucket
-- Note: storage.objects RLS is usually enabled by default if the table exists.

-- Policy to allow authenticated users to upload images to the family-wall bucket
create policy "Allow authenticated uploads to family-wall"
on storage.objects for insert
to authenticated
with check (bucket_id = 'family-wall');

-- Policy to allow authenticated users to view images in the family-wall bucket
create policy "Allow authenticated viewing of family-wall"
on storage.objects for select
to authenticated
using (bucket_id = 'family-wall');

-- Policy to allow users to delete their own images (optional but good for cleanup)
create policy "Allow users to delete their own family-wall uploads"
on storage.objects for delete
to authenticated
using (bucket_id = 'family-wall' and owner = auth.uid());
