-- Keep signup and account discovery server-side and privacy-preserving.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  person_id uuid;
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  requested_gender text := meta->>'gender';
begin
  if exists (select 1 from public.profiles where id = new.id) then
    return new;
  end if;

  insert into public.persons (
    first_name,
    middle_name,
    last_name,
    gender,
    birth_date,
    country_of_residence,
    owner_uid
  ) values (
    coalesce(nullif(meta->>'first_name', ''), 'Member'),
    nullif(meta->>'middle_name', ''),
    nullif(meta->>'last_name', ''),
    case when requested_gender in ('male', 'female', 'other') then requested_gender else 'other' end,
    case when nullif(meta->>'birth_date', '') is null then null else (meta->>'birth_date')::date end,
    nullif(meta->>'country_of_residence', ''),
    new.id
  ) returning id into person_id;

  insert into public.profiles (id, email, person_id)
  values (new.id, new.email, person_id);

  insert into public.privacy_settings (user_uid)
  values (new.id)
  on conflict (user_uid) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create or replace function public.lookup_profile_by_email(p_email text)
returns table (id uuid, email text, person_id uuid)
language sql
security definer set search_path = public
as $$
  select p.id, p.email, p.person_id
  from public.profiles p
  where auth.uid() is not null
    and lower(p.email) = lower(trim(p_email))
    and p.id <> auth.uid()
  limit 1;
$$;

revoke all on function public.lookup_profile_by_email(text) from public;
grant execute on function public.lookup_profile_by_email(text) to authenticated;

create index if not exists idx_profiles_email_lower on public.profiles (lower(email));

create or replace function public.can_view_person(viewer uuid, target uuid)
returns boolean
language sql
security definer set search_path = public
as $$
  with recursive
  target_person as (
    select p.id, p.owner_uid, p.is_private, pr.person_id as root_id
    from public.persons p
    join public.profiles pr on pr.id = p.owner_uid
    where p.id = target
  ),
  ancestors(id) as (
    select pc.parent_id from public.parent_child pc join target_person t on t.root_id = pc.child_id
    union
    select pc.parent_id from public.parent_child pc join ancestors a on a.id = pc.child_id
  ),
  descendants(id) as (
    select pc.child_id from public.parent_child pc join target_person t on t.root_id = pc.parent_id
    union
    select pc.child_id from public.parent_child pc join descendants d on d.id = pc.parent_id
  ),
  siblings(id) as (
    select distinct pc2.child_id
    from public.parent_child pc1
    join public.parent_child pc2 on pc2.parent_id = pc1.parent_id
    join target_person t on t.root_id = pc1.child_id
    where pc2.child_id <> t.root_id
  )
  select exists (
    select 1
    from target_person t
    left join public.privacy_settings s on s.user_uid = t.owner_uid
    where t.owner_uid = viewer
       or exists (
         select 1 from public.network_connections c
         where c.status = 'accepted'
           and ((c.requester_uid = viewer and c.recipient_uid = t.owner_uid)
             or (c.requester_uid = t.owner_uid and c.recipient_uid = viewer))
       )
       and (
         target = t.root_id
         or (coalesce(s.share_parents, true) and target in (select id from ancestors))
         or (coalesce(s.share_children, true) and target in (select id from descendants))
         or (coalesce(s.share_siblings, true) and target in (select id from siblings))
       )
       and (target = t.root_id or coalesce(t.is_private, false) = false)
  );
$$;

drop policy if exists "Connected users can view public persons" on public.persons;
create policy "Connected users can view shared persons" on public.persons
  for select using (public.can_view_person(auth.uid(), id));

drop policy if exists "Users can view parent_child links" on public.parent_child;
create policy "Users can view visible parent_child links" on public.parent_child
  for select using (
    public.can_view_person(auth.uid(), parent_id)
    and public.can_view_person(auth.uid(), child_id)
  );

drop policy if exists "Users can view marriage links" on public.marriages;
create policy "Users can view visible marriage links" on public.marriages
  for select using (
    public.can_view_person(auth.uid(), person1_id)
    and public.can_view_person(auth.uid(), person2_id)
  );

create policy "Requesters can cancel connection requests" on public.network_connections
  for delete using (auth.uid() = requester_uid and status = 'pending');

create policy "Users can create merge sessions with connections" on public.tree_merge_sessions
  for insert with check (
    auth.uid() = initiator_uid
    and exists (
      select 1 from public.network_connections c
      where c.status = 'accepted'
        and ((c.requester_uid = initiator_uid and c.recipient_uid = target_uid)
          or (c.requester_uid = target_uid and c.recipient_uid = initiator_uid))
    )
  );

create policy "Merge participants can update sessions" on public.tree_merge_sessions
  for update using (auth.uid() = initiator_uid or auth.uid() = target_uid);

create policy "Merge participants can create conflicts" on public.merge_conflicts
  for insert with check (exists (
    select 1 from public.tree_merge_sessions s
    where s.id = session_id and (s.initiator_uid = auth.uid() or s.target_uid = auth.uid())
  ));

create policy "Merge participants can update conflicts" on public.merge_conflicts
  for update using (exists (
    select 1 from public.tree_merge_sessions s
    where s.id = session_id and (s.initiator_uid = auth.uid() or s.target_uid = auth.uid())
  ));

create or replace function public.execute_tree_merge(p_session_id uuid)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  session_row record;
  conflict_row record;
  keep_id uuid;
  drop_id uuid;
begin
  select * into session_row
  from public.tree_merge_sessions
  where id = p_session_id and status = 'in_progress';
  if not found or auth.uid() <> session_row.target_uid then
    raise exception 'Merge session not found or unauthorized';
  end if;

  for conflict_row in select * from public.merge_conflicts where session_id = p_session_id loop
    if conflict_row.resolution_status = 'keep_both_as_separate' then
      continue;
    end if;
    keep_id := case when conflict_row.resolution_status = 'resolved_keep_a' then conflict_row.node_a_id else conflict_row.node_b_id end;
    drop_id := case when keep_id = conflict_row.node_a_id then conflict_row.node_b_id else conflict_row.node_a_id end;

    if exists (select 1 from public.profiles where person_id = drop_id) then
      raise exception 'Cannot merge a linked account person';
    end if;

    delete from public.parent_child a
    using public.parent_child b
    where a.id <> b.id
      and ((a.parent_id = drop_id and b.parent_id = keep_id and a.child_id = b.child_id)
        or (a.child_id = drop_id and b.child_id = keep_id and a.parent_id = b.parent_id));
    update public.parent_child set parent_id = keep_id where parent_id = drop_id;
    update public.parent_child set child_id = keep_id where child_id = drop_id;
    delete from public.parent_child where parent_id = child_id;

    delete from public.marriages a
    using public.marriages b
    where a.id <> b.id
      and (
        (a.person1_id = drop_id and b.person1_id = keep_id and a.person2_id = b.person2_id)
        or (a.person2_id = drop_id and b.person2_id = keep_id and a.person1_id = b.person1_id)
        or (least(a.person1_id, a.person2_id) = least(b.person1_id, b.person2_id)
          and greatest(a.person1_id, a.person2_id) = greatest(b.person1_id, b.person2_id))
      );
    update public.marriages set person1_id = least(keep_id, person2_id), person2_id = greatest(keep_id, person2_id) where person1_id = drop_id;
    update public.marriages set person1_id = least(person1_id, keep_id), person2_id = greatest(person1_id, keep_id) where person2_id = drop_id;
    update public.events set person_id = keep_id where person_id = drop_id;
    delete from public.persons where id = drop_id;
  end loop;

  update public.tree_merge_sessions set status = 'completed' where id = p_session_id;
end;
$$;
