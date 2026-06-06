-- Enable RLS on posts table
alter table public.posts enable row level security;

-- Policy to allow anyone authenticated to view posts
create policy "Allow authenticated users to view all posts"
on public.posts for select
to authenticated
using (true);

-- Policy to allow users to create their own posts
create policy "Allow users to create their own posts"
on public.posts for insert
to authenticated
with check (auth.uid() = author_uid);

-- Policy to allow users to update their own posts
create policy "Allow users to update their own posts"
on public.posts for update
to authenticated
using (auth.uid() = author_uid);

-- Enable RLS on reactions table
alter table public.reactions enable row level security;

-- Ensure unique reaction per user per post
alter table public.reactions drop constraint if exists reactions_post_id_user_uid_key;
alter table public.reactions add constraint reactions_post_id_user_uid_key unique (post_id, user_uid);

-- Policy to allow anyone authenticated to view reactions
create policy "Allow authenticated users to view all reactions"
on public.reactions for select
to authenticated
using (true);

-- Policy to allow users to manage their own reactions
create policy "Allow users to manage their own reactions"
on public.reactions for insert
to authenticated
with check (auth.uid() = user_uid);

create policy "Allow users to update their own reactions"
on public.reactions for update
to authenticated
using (auth.uid() = user_uid);

create policy "Allow users to delete their own reactions"
on public.reactions for delete
to authenticated
using (auth.uid() = user_uid);
