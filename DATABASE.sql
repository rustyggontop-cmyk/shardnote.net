-- Run this in Supabase SQL Editor after creating your project.
create table public.clan_invites (
  code text primary key,
  uses integer not null default 0,
  max_uses integer not null default 10,
  active boolean not null default true
);

-- Example invite. CHANGE THIS CODE before sharing it.
insert into public.clan_invites(code,max_uses) values ('SHARD-2026',10);

alter table public.clan_invites enable row level security;

create policy "Anyone can validate active invite codes"
on public.clan_invites for select
to anon, authenticated
using (active = true);

-- For a production deployment, use a server-side function/transaction
-- to increment uses atomically rather than relying on a browser update.
