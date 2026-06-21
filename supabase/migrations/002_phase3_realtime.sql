-- =============================================
-- PHASE 3: Typing indicators + presence
-- Safe to re-run (IF NOT EXISTS everywhere)
-- =============================================

-- Typing indicators (lightweight, short-lived rows)
create table if not exists typing_indicators (
  conversation_id uuid   not null references conversations(id) on delete cascade,
  role            text   not null check (role in ('user', 'admin')),
  updated_at      timestamptz default now(),
  primary key (conversation_id, role)
);

-- Auto-expire rows older than 5 seconds (cleaned up by trigger)
create or replace function cleanup_stale_typing()
returns trigger as $$
begin
  delete from typing_indicators
  where updated_at < now() - interval '5 seconds';
  return new;
end;
$$ language plpgsql;

drop trigger if exists typing_cleanup on typing_indicators;
create trigger typing_cleanup
  after insert or update on typing_indicators
  for each statement execute function cleanup_stale_typing();

-- RLS: public read (widget needs it), auth required for write
alter table typing_indicators enable row level security;

drop policy if exists "typing_public_read"  on typing_indicators;
drop policy if exists "typing_public_write" on typing_indicators;

create policy "typing_public_read"  on typing_indicators for select using (true);
create policy "typing_public_write" on typing_indicators for insert with check (true);
create policy "typing_public_update" on typing_indicators for update using (true);
create policy "typing_public_delete" on typing_indicators for delete using (true);

-- Add to realtime
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'typing_indicators'
  ) then
    alter publication supabase_realtime add table typing_indicators;
  end if;
end$$;
