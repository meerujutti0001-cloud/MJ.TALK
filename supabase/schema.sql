-- =============================================
-- AI Customer Support Chatbot Platform Schema
-- =============================================

-- Organizations (one per business owner)
create table organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_id uuid references auth.users(id) on delete cascade,
  created_at timestamptz default now()
);

-- Team members
create table team_members (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references organizations(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  role text check (role in ('owner', 'agent')) default 'agent',
  email text not null,
  invited_at timestamptz default now(),
  accepted_at timestamptz
);

-- Chatbots
create table chatbots (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references organizations(id) on delete cascade,
  name text not null,
  description text,
  system_prompt text not null default '',
  status text check (status in ('active', 'inactive')) default 'active',
  widget_color text default '#6366f1',
  avatar_url text,
  pre_chat_form_enabled boolean default false,
  allowed_domains text[],
  escalation_keyword text default 'ESCALATE',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Conversations
create table conversations (
  id uuid primary key default gen_random_uuid(),
  chatbot_id uuid references chatbots(id) on delete cascade,
  session_id text not null,
  visitor_name text,
  visitor_email text,
  page_url text,
  browser_info text,
  status text check (status in ('open', 'escalated', 'resolved')) default 'open',
  message_count int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Messages
create table messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references conversations(id) on delete cascade,
  role text check (role in ('user', 'assistant', 'admin')) not null,
  content text not null,
  created_at timestamptz default now()
);

-- Notifications
create table notifications (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references organizations(id) on delete cascade,
  conversation_id uuid references conversations(id) on delete cascade,
  type text check (type in ('escalated', 'flagged', 'idle')) not null,
  message text not null,
  read boolean default false,
  created_at timestamptz default now()
);

-- =============================================
-- Row Level Security
-- =============================================

alter table organizations enable row level security;
alter table team_members enable row level security;
alter table chatbots enable row level security;
alter table conversations enable row level security;
alter table messages enable row level security;
alter table notifications enable row level security;

-- Organizations: owner and team members can access
create policy "org_access" on organizations for all using (
  owner_id = auth.uid() or
  id in (select org_id from team_members where user_id = auth.uid())
);

-- Chatbots: accessible by org members
create policy "chatbot_access" on chatbots for all using (
  org_id in (
    select id from organizations
    where owner_id = auth.uid()
    or id in (select org_id from team_members where user_id = auth.uid())
  )
);

-- Conversations: accessible by org members
create policy "conversation_access" on conversations for all using (
  chatbot_id in (
    select id from chatbots where org_id in (
      select id from organizations
      where owner_id = auth.uid()
      or id in (select org_id from team_members where user_id = auth.uid())
    )
  )
);

-- Allow public insert/read for widget (no auth required)
create policy "public_conversation_insert" on conversations for insert with check (true);
create policy "public_conversation_read" on conversations for select using (true);
create policy "public_message_insert" on messages for insert with check (true);
create policy "public_message_read" on messages for select using (true);

-- Messages: accessible by org members (authenticated)
create policy "message_access" on messages for all using (
  conversation_id in (
    select id from conversations where chatbot_id in (
      select id from chatbots where org_id in (
        select id from organizations
        where owner_id = auth.uid()
        or id in (select org_id from team_members where user_id = auth.uid())
      )
    )
  )
);

-- Notifications: accessible by org members
create policy "notification_access" on notifications for all using (
  org_id in (
    select id from organizations
    where owner_id = auth.uid()
    or id in (select org_id from team_members where user_id = auth.uid())
  )
);

-- Team members: org owners and the member themselves
create policy "team_access" on team_members for all using (
  org_id in (select id from organizations where owner_id = auth.uid())
  or user_id = auth.uid()
);

-- =============================================
-- Functions & Triggers
-- =============================================

-- Auto-update updated_at for chatbots
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_chatbots_updated_at
  before update on chatbots
  for each row execute function update_updated_at_column();

create trigger update_conversations_updated_at
  before update on conversations
  for each row execute function update_updated_at_column();

-- Increment message_count on new message
create or replace function increment_message_count()
returns trigger as $$
begin
  update conversations
  set message_count = message_count + 1,
      updated_at = now()
  where id = new.conversation_id;
  return new;
end;
$$ language plpgsql;

create trigger on_message_insert
  after insert on messages
  for each row execute function increment_message_count();

-- Enable realtime for live updates
alter publication supabase_realtime add table conversations;
alter publication supabase_realtime add table messages;
alter publication supabase_realtime add table notifications;
