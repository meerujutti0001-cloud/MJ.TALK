-- =============================================
-- PHASE 5: Knowledge Base + AI Hybrid Model
-- Run in Supabase Dashboard → SQL Editor
-- Safe to re-run (IF NOT EXISTS everywhere)
-- =============================================

-- ─────────────────────────────────────────────
-- Knowledge Base articles (per chatbot)
-- ─────────────────────────────────────────────
create table if not exists kb_articles (
  id              uuid primary key default gen_random_uuid(),
  chatbot_id      uuid not null references chatbots(id) on delete cascade,
  org_id          uuid not null references organizations(id) on delete cascade,
  title           text not null,
  content         text not null,
  category        text not null default 'general'
                    check (category in ('general','account','payment','refund','technical','setup','faq')),
  tags            text[] default '{}',
  is_published    boolean default true,
  created_by      uuid references auth.users(id) on delete set null,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- ─────────────────────────────────────────────
-- Extend ai_sessions with intent + summary
-- ─────────────────────────────────────────────
alter table ai_sessions
  add column if not exists intent_label      text,
  add column if not exists intent_confidence numeric(3,2),
  add column if not exists handoff_summary   text,
  add column if not exists kb_articles_used  uuid[] default '{}';

alter table ai_sessions
  drop constraint if exists ai_sessions_intent_check;
alter table ai_sessions
  add constraint ai_sessions_intent_check check (
    intent_label is null or
    intent_label in ('refund','technical','account','billing','complaint','setup','general','other')
  );

-- ─────────────────────────────────────────────
-- Indexes
-- ─────────────────────────────────────────────
create index if not exists idx_kb_chatbot    on kb_articles(chatbot_id);
create index if not exists idx_kb_org        on kb_articles(org_id);
create index if not exists idx_kb_category   on kb_articles(category);
create index if not exists idx_kb_published  on kb_articles(is_published) where is_published = true;

-- ─────────────────────────────────────────────
-- Updated_at trigger for kb_articles
-- ─────────────────────────────────────────────
drop trigger if exists update_kb_articles_updated_at on kb_articles;
create trigger update_kb_articles_updated_at
  before update on kb_articles
  for each row execute function update_updated_at_column();

-- ─────────────────────────────────────────────
-- RLS for kb_articles
-- ─────────────────────────────────────────────
alter table kb_articles enable row level security;

drop policy if exists "kb_org_access"    on kb_articles;
drop policy if exists "kb_public_read"   on kb_articles;

-- Org members can do everything
create policy "kb_org_access" on kb_articles for all using (
  org_id in (
    select id from organizations
    where owner_id = auth.uid()
       or id in (select org_id from team_members where user_id = auth.uid())
  )
);

-- Widget / public can read published articles (for AI context injection)
create policy "kb_public_read" on kb_articles for select using (is_published = true);

-- ─────────────────────────────────────────────
-- Add kb_articles to realtime (optional)
-- ─────────────────────────────────────────────
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'kb_articles'
  ) then
    alter publication supabase_realtime add table kb_articles;
  end if;
end$$;
