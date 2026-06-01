-- Run this in the Supabase SQL Editor for this project.
-- It creates the tables expected by the app and repairs the auth signup trigger.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  role text not null default 'creator' check (role in ('creator', 'reviewer')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.content_drafts (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  body text not null,
  status text not null default 'draft' check (status in ('draft', 'pending_review', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  draft_id uuid not null references public.content_drafts(id) on delete cascade,
  reviewer_id uuid not null references public.profiles(id) on delete cascade,
  comment_text text not null,
  created_at timestamptz not null default now()
);

-- Drop policies before changing column types. Older policies can depend on role/status.
drop policy if exists "Allow creators to insert drafts" on public.content_drafts;
drop policy if exists "Allow creators to update own drafts" on public.content_drafts;
drop policy if exists "Allow creators to delete own drafts" on public.content_drafts;
drop policy if exists "Allow creators to view own drafts" on public.content_drafts;
drop policy if exists "Allow reviewers to view pending drafts" on public.content_drafts;
drop policy if exists "Allow reviewers to update drafts" on public.content_drafts;
drop policy if exists "Allow reviewers to update draft status" on public.content_drafts;
drop policy if exists "Allow reviewers to view drafts" on public.content_drafts;
drop policy if exists "Allow reviewers to read drafts" on public.content_drafts;
drop policy if exists "Allow reviewers to insert comments" on public.comments;
drop policy if exists "Allow reviewers to post comments" on public.comments;
drop policy if exists "Allow reviewers to view comments" on public.comments;
drop policy if exists "Allow users to view comments" on public.comments;
drop policy if exists "Allow users to view profiles" on public.profiles;
drop policy if exists "Allow users to update own profile" on public.profiles;
drop policy if exists "Profiles are readable by signed-in users" on public.profiles;
drop policy if exists "Users can update their own profile" on public.profiles;
drop policy if exists "Users can insert their own profile" on public.profiles;
drop policy if exists "Creators and reviewers can read drafts" on public.content_drafts;
drop policy if exists "Creators can create their own drafts" on public.content_drafts;
drop policy if exists "Creators and reviewers can update drafts" on public.content_drafts;
drop policy if exists "Creators can delete draft drafts" on public.content_drafts;
drop policy if exists "Users can read relevant comments" on public.comments;
drop policy if exists "Reviewers can create comments" on public.comments;

-- Catch any other policy names from previous experiments.
do $$
declare
  policy_to_drop record;
begin
  for policy_to_drop in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'public'
    and tablename in ('profiles', 'content_drafts', 'comments')
  loop
    execute format(
      'drop policy if exists %I on %I.%I',
      policy_to_drop.policyname,
      policy_to_drop.schemaname,
      policy_to_drop.tablename
    );
  end loop;
end;
$$;

-- If you already created tables earlier, make sure they have the columns this app expects.
alter table public.profiles add column if not exists email text;
alter table public.profiles add column if not exists full_name text;
alter table public.profiles add column if not exists role text not null default 'creator';
alter table public.profiles add column if not exists created_at timestamptz not null default now();
alter table public.profiles add column if not exists updated_at timestamptz not null default now();

-- If an earlier setup created role as a custom enum, normalize it to text.
alter table public.profiles alter column role drop default;
alter table public.profiles alter column role type text using role::text;
alter table public.profiles alter column role set default 'creator';
alter table public.profiles alter column role set not null;

alter table public.content_drafts add column if not exists creator_id uuid references public.profiles(id) on delete cascade;
alter table public.content_drafts add column if not exists title text;
alter table public.content_drafts add column if not exists body text;
alter table public.content_drafts add column if not exists status text not null default 'draft';
alter table public.content_drafts add column if not exists created_at timestamptz not null default now();
alter table public.content_drafts add column if not exists updated_at timestamptz not null default now();

-- Same idea for status if an earlier setup used a custom enum.
alter table public.content_drafts alter column status drop default;
alter table public.content_drafts alter column status type text using status::text;
alter table public.content_drafts alter column status set default 'draft';
alter table public.content_drafts alter column status set not null;

alter table public.comments add column if not exists draft_id uuid references public.content_drafts(id) on delete cascade;
alter table public.comments add column if not exists reviewer_id uuid references public.profiles(id) on delete cascade;
alter table public.comments add column if not exists comment_text text;
alter table public.comments add column if not exists created_at timestamptz not null default now();

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_touch_updated_at on public.profiles;
create trigger profiles_touch_updated_at
before update on public.profiles
for each row execute function public.touch_updated_at();

drop trigger if exists content_drafts_touch_updated_at on public.content_drafts;
create trigger content_drafts_touch_updated_at
before update on public.content_drafts
for each row execute function public.touch_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  requested_role text;
begin
  requested_role := coalesce(new.raw_user_meta_data->>'role', 'creator');

  if requested_role not in ('creator', 'reviewer') then
    requested_role := 'creator';
  end if;

  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    requested_role
  )
  on conflict (id) do update set
    email = excluded.email,
    full_name = coalesce(public.profiles.full_name, excluded.full_name),
    role = coalesce(public.profiles.role, excluded.role);

  return new;
end;
$$;

-- Old tutorial/experiment triggers on auth.users can keep failing even after a new trigger is added.
-- These names cover the common variants people create while following Supabase examples.
drop trigger if exists create_profile_on_signup on auth.users;
drop trigger if exists create_user_profile on auth.users;
drop trigger if exists handle_new_user on auth.users;
drop trigger if exists on_user_created on auth.users;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.content_drafts enable row level security;
alter table public.comments enable row level security;

drop policy if exists "Profiles are readable by signed-in users" on public.profiles;
create policy "Profiles are readable by signed-in users"
on public.profiles for select
to authenticated
using (true);

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
on public.profiles for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

drop policy if exists "Users can insert their own profile" on public.profiles;
create policy "Users can insert their own profile"
on public.profiles for insert
to authenticated
with check (id = auth.uid());

drop policy if exists "Creators can select own drafts" on public.content_drafts;
create policy "Creators can select own drafts"
on public.content_drafts for select
to authenticated
using (creator_id = auth.uid());

drop policy if exists "Reviewers can select all drafts" on public.content_drafts;
create policy "Reviewers can select all drafts"
on public.content_drafts for select
to authenticated
using (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid()
    and profiles.role = 'reviewer'
  )
);

drop policy if exists "Creators can create their own drafts" on public.content_drafts;
create policy "Creators can create their own drafts"
on public.content_drafts for insert
to authenticated
with check (
  creator_id = auth.uid()
  and exists (
    select 1 from public.profiles
    where profiles.id = auth.uid()
    and profiles.role = 'creator'
  )
);

drop policy if exists "Creators can update own draft drafts" on public.content_drafts;
create policy "Creators can update own draft drafts"
on public.content_drafts for update
to authenticated
using (
  creator_id = auth.uid()
  and status = 'draft'
  and exists (
    select 1 from public.profiles
    where profiles.id = auth.uid()
    and profiles.role = 'creator'
  )
)
with check (
  creator_id = auth.uid()
  and status in ('draft', 'pending_review')
  and exists (
    select 1 from public.profiles
    where profiles.id = auth.uid()
    and profiles.role = 'creator'
  )
);

drop policy if exists "Reviewers can update draft status" on public.content_drafts;
create policy "Reviewers can update draft status"
on public.content_drafts for update
to authenticated
using (
  status = 'pending_review'
  and exists (
    select 1 from public.profiles
    where profiles.id = auth.uid()
    and profiles.role = 'reviewer'
  )
)
with check (
  status in ('approved', 'rejected')
  and exists (
    select 1 from public.profiles
    where profiles.id = auth.uid()
    and profiles.role = 'reviewer'
  )
);

drop policy if exists "Creators can delete draft drafts" on public.content_drafts;
create policy "Creators can delete draft drafts"
on public.content_drafts for delete
to authenticated
using (
  creator_id = auth.uid()
  and status = 'draft'
  and exists (
    select 1 from public.profiles
    where profiles.id = auth.uid()
    and profiles.role = 'creator'
  )
);

drop policy if exists "Users can read relevant comments" on public.comments;
create policy "Users can read relevant comments"
on public.comments for select
to authenticated
using (
  reviewer_id = auth.uid()
  or exists (
    select 1 from public.content_drafts
    where content_drafts.id = comments.draft_id
    and content_drafts.creator_id = auth.uid()
  )
  or exists (
    select 1 from public.profiles
    where profiles.id = auth.uid()
    and profiles.role = 'reviewer'
  )
);

drop policy if exists "Reviewers can create comments" on public.comments;
create policy "Reviewers can create comments"
on public.comments for insert
to authenticated
with check (
  reviewer_id = auth.uid()
  and exists (
    select 1 from public.profiles
    where profiles.id = auth.uid()
    and profiles.role = 'reviewer'
  )
);

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
    and schemaname = 'public'
    and tablename = 'content_drafts'
  ) then
    alter publication supabase_realtime add table public.content_drafts;
  end if;
end;
$$;
