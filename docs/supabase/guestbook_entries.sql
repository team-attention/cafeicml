-- Cafe @ICML guestbook Supabase setup.
-- Run this only against a fresh project/table. It intentionally fails closed when
-- public.guestbook_entries already exists; review existing data and policies by
-- hand instead of layering grants onto an unknown table.

begin;

-- Preflight: must return no rows before setup.
select
  table_schema,
  table_name
from information_schema.tables
where table_schema = 'public'
  and table_name = 'guestbook_entries';

-- Fail closed: do not use create table if not exists for the main path.
do $$
begin
  if to_regclass('public.guestbook_entries') is not null then
    raise exception 'public.guestbook_entries already exists; aborting fresh setup';
  end if;
end
$$;

create table public.guestbook_entries (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null,
  profile_url text,
  intent text not null,
  message text not null,

  constraint guestbook_entries_name_not_blank
    check (name = btrim(name) and char_length(name) between 1 and 80),
  constraint guestbook_entries_profile_url_http
    check (
      profile_url is null
      or (
        profile_url = btrim(profile_url)
        and char_length(profile_url) <= 240
        and profile_url ~* '^https?://[^[:space:]]+$'
      )
    ),
  constraint guestbook_entries_intent_allowed
    check (intent in ('collab', 'hiring', 'open-to-work', 'business', 'special-request')),
  constraint guestbook_entries_message_not_blank
    check (message = btrim(message) and char_length(message) between 1 and 500)
);

alter table public.guestbook_entries enable row level security;
alter table public.guestbook_entries force row level security;

revoke all on table public.guestbook_entries from public;
revoke all on table public.guestbook_entries from anon;
revoke all on table public.guestbook_entries from authenticated;
revoke all (id, created_at, name, profile_url, intent, message)
  on table public.guestbook_entries
  from anon;
revoke all (id, created_at, name, profile_url, intent, message)
  on table public.guestbook_entries
  from authenticated;


grant select (id, created_at, name, profile_url, intent, message)
  on table public.guestbook_entries
  to anon;

grant insert (name, profile_url, intent, message)
  on table public.guestbook_entries
  to anon;

create policy "Anyone can read guestbook entries"
  on public.guestbook_entries
  for select
  to anon
  using (true);

create policy "Anyone can sign the guestbook"
  on public.guestbook_entries
  for insert
  to anon
  with check (true);

commit;

-- Verification queries and checklist.
-- Positive evidence: anon has read access to exactly the public columns.
select grantee, privilege_type, column_name
from information_schema.column_privileges
where table_schema = 'public'
  and table_name = 'guestbook_entries'
  and grantee = 'anon'
order by privilege_type, column_name;

-- Positive evidence: RLS is enabled and forced.
select
  n.nspname as schemaname,
  c.relname as tablename,
  c.relrowsecurity as rowsecurity,
  c.relforcerowsecurity as forcerowsecurity
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname = 'guestbook_entries';

-- Positive evidence: only select and insert policies exist for anon.
select schemaname, tablename, policyname, cmd, roles, qual, with_check
from pg_policies
where schemaname = 'public'
  and tablename = 'guestbook_entries'
order by policyname;

-- Positive evidence: anon can insert only the browser payload columns.
-- set role anon;
-- insert into public.guestbook_entries (name, profile_url, intent, message)
-- values ('Test Visitor', 'https://example.com', 'collab', 'Testing the guestbook setup.');
-- reset role;

-- Negative evidence: anon must not insert generated/admin columns.
-- set role anon;
-- insert into public.guestbook_entries (id, name, profile_url, intent, message)
-- values (gen_random_uuid(), 'Bad Visitor', null, 'collab', 'This should fail.');
-- insert into public.guestbook_entries (created_at, name, profile_url, intent, message)
-- values (now(), 'Bad Visitor', null, 'collab', 'This should fail.');
-- reset role;

-- Negative evidence: dirty whitespace, over-limit values, and non-http URLs must fail.
-- set role anon;
-- insert into public.guestbook_entries (name, profile_url, intent, message)
-- values (' Bad Visitor ', null, 'collab', 'This should fail.');
-- insert into public.guestbook_entries (name, profile_url, intent, message)
-- values ('Bad Visitor', ' https://example.com ', 'collab', 'This should fail.');
-- insert into public.guestbook_entries (name, profile_url, intent, message)
-- values (repeat('a', 81), null, 'collab', 'This should fail.');
-- insert into public.guestbook_entries (name, profile_url, intent, message)
-- values ('Bad URL', 'https://' || repeat('a', 241), 'collab', 'This should fail.');
-- insert into public.guestbook_entries (name, profile_url, intent, message)
-- values ('Bad URL', 'javascript:alert(1)', 'collab', 'This should fail.');
-- reset role;

-- Negative evidence: invalid intent must fail.
-- set role anon;
-- insert into public.guestbook_entries (name, profile_url, intent, message)
-- values ('Bad Intent', null, 'sponsor', 'This should fail.');
-- reset role;

-- Negative evidence: anon must not update or delete entries.
-- set role anon;
-- update public.guestbook_entries set message = 'This should fail.' where true;
-- delete from public.guestbook_entries where true;
-- reset role;
