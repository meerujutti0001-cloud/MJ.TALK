-- =============================================
-- PHASE 1: Enhanced Schema for Professional Chat System
-- Run this in Supabase Dashboard → SQL Editor
-- Safe to re-run (all statements use IF NOT EXISTS / IF EXISTS)
-- =============================================


-- ─────────────────────────────────────────────
-- STEP 1: Drop old policies so we can recreate
-- ─────────────────────────────────────────────
drop policy if exists "org_access"                  on organizations;
drop policy if exists "chatbot_access"              on chatbots;
drop policy if exists "conversation_access"         on conversations;
drop policy if exists "conversation_org_access"     on conversations;
drop policy if exists "public_conversation_insert"  on conversations;
drop policy if exists "public_conversation_read"    on conversations;
drop policy if exists "conversation_public_insert"  on conversations;
drop policy if exists "conversation_public_select"  on conversations;
drop policy if exists "public_message_insert"       on messages;
drop policy if exists "public_message_read"         on messages;
drop policy if exists "message_access"              on messages;
drop policy if exists "message_org_access"          on messages;
drop policy if exists "message_public_insert"       on messages;
drop policy if exists "message_public_select"       on messages;
drop policy if exists "notification_access"         on notifications;
drop policy if exists "team_access"                 on team_members;


-- ─────────────────────────────────────────────
-- STEP 2: Patch notifications BEFORE triggers use new columns
-- ─────────────────────────────────────────────

-- Drop the old type constraint that blocks new event types
alter table notifications
  drop constraint if exists notifications_type_check;

-- Add new columns to notifications
alter table notifications
  add column if not exists target_user_id uuid references auth.users(id) on delete cascade,
  add column if not exists message_id     uuid references messages(id)   on delete cascade,
  add column if not exists priority       text default 'normal',
  add column if not exists action_url     text,
  add column if not exists read_at        timestamptz;

-- Re-add type constraint with full set of allowed values
alter table notifications
  add constraint notifications_type_check check (
    type in ('new_chat','new_message','escalated','flagged','idle','assigned','mention')
  );

-- Re-add priority constraint
alter table notifications
  drop constraint if exists notifications_priority_check;
alter table notifications
  add constraint notifications_priority_check check (
    priority in ('low','normal','high','urgent')
  );


-- ─────────────────────────────────────────────
-- STEP 3: Extend conversations table
-- ─────────────────────────────────────────────
alter table conversations
  add column if not exists assigned_agent_id        uuid references auth.users(id) on delete set null,
  add column if not exists priority                 text default 'medium',
  add column if not exists source                   text default 'widget',
  add column if not exists subject                  text,
  add column if not exists last_message_at          timestamptz default now(),
  add column if not exists escalation_requested_at  timestamptz,
  add column if not exists assigned_at              timestamptz,
  add column if not exists closed_at                timestamptz;

-- Add check constraints separately (add column if not exists won't re-add them)
alter table conversations
  drop constraint if exists conversations_priority_check,
  drop constraint if exists conversations_source_check;
alter table conversations
  add constraint conversations_priority_check check (priority in ('low','medium','high')),
  add constraint conversations_source_check   check (source   in ('widget','manual','ai_handoff','human_request'));


-- ─────────────────────────────────────────────
-- STEP 4: Extend messages table
-- ─────────────────────────────────────────────
alter table messages
  add column if not exists sender_id       uuid references auth.users(id) on delete set null,
  add column if not exists message_type    text default 'text',
  add column if not exists is_seen         boolean default false,
  add column if not exists delivery_status text default 'sent',
  add column if not exists metadata        jsonb  default '{}'::jsonb;

alter table messages
  drop constraint if exists messages_message_type_check,
  drop constraint if exists messages_delivery_status_check;
alter table messages
  add constraint messages_message_type_check    check (message_type    in ('text','image','file','system')),
  add constraint messages_delivery_status_check check (delivery_status in ('pending','sent','delivered','failed'));


-- ─────────────────────────────────────────────
-- STEP 5: New tables
-- ─────────────────────────────────────────────

-- User profiles (roles + status)
create table if not exists profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text unique not null,
  full_name   text,
  role        text not null default 'customer'
                check (role in ('customer','agent','admin','super_admin')),
  status      text not null default 'active'
                check (status in ('active','inactive','suspended')),
  avatar_url  text,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- Agent online status + workload
create table if not exists agent_status (
  agent_id             uuid primary key references auth.users(id) on delete cascade,
  online_status        text not null default 'offline'
                         check (online_status in ('online','away','busy','offline')),
  last_active          timestamptz default now(),
  active_chat_count    int         default 0,
  max_concurrent_chats int         default 5,
  updated_at           timestamptz default now()
);

-- Audit trail for conversations
create table if not exists chat_events (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references conversations(id) on delete cascade,
  event_type      text not null
                    check (event_type in ('created','assigned','escalated','closed','reopened','ai_to_human','transferred','note_added')),
  event_by        uuid references auth.users(id) on delete set null,
  event_data      jsonb default '{}'::jsonb,
  created_at      timestamptz default now()
);

-- AI session tracking
create table if not exists ai_sessions (
  id                   uuid primary key default gen_random_uuid(),
  conversation_id      uuid not null references conversations(id) on delete cascade,
  detected_intent      text,
  ai_confidence_score  numeric(3,2),
  escalated_to_human   boolean default false,
  escalation_reason    text,
  ai_summary           text,
  created_at           timestamptz default now(),
  updated_at           timestamptz default now()
);

-- Internal agent notes (not visible to customers)
create table if not exists conversation_notes (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references conversations(id) on delete cascade,
  agent_id        uuid not null references auth.users(id)    on delete cascade,
  note_text       text not null,
  created_at      timestamptz default now()
);

-- Extended customer profiles
create table if not exists customer_details (
  id                  uuid primary key default gen_random_uuid(),
  visitor_email       text unique,
  visitor_name        text,
  first_seen_at       timestamptz default now(),
  last_seen_at        timestamptz default now(),
  total_conversations int         default 0,
  tags                text[]      default '{}',
  metadata            jsonb       default '{}'::jsonb
);


-- ─────────────────────────────────────────────
-- STEP 6: Indexes for performance
-- ─────────────────────────────────────────────
create index if not exists idx_conversations_status          on conversations(status);
create index if not exists idx_conversations_assigned_agent  on conversations(assigned_agent_id);
create index if not exists idx_conversations_chatbot         on conversations(chatbot_id);
create index if not exists idx_conversations_created_at      on conversations(created_at desc);
create index if not exists idx_conversations_last_msg        on conversations(last_message_at desc);
create index if not exists idx_messages_conversation         on messages(conversation_id);
create index if not exists idx_messages_created_at           on messages(created_at);
create index if not exists idx_notifications_unread_org      on notifications(org_id)         where read = false;
create index if not exists idx_notifications_unread_user     on notifications(target_user_id) where read = false;
create index if not exists idx_chat_events_conversation      on chat_events(conversation_id);
create index if not exists idx_agent_status_online           on agent_status(online_status)   where online_status != 'offline';


-- ─────────────────────────────────────────────
-- STEP 7: Functions & triggers
-- (tables + columns already exist above — safe to reference)
-- ─────────────────────────────────────────────

-- 7a. Keep last_message_at in sync
create or replace function update_conversation_last_message()
returns trigger as $$
begin
  update conversations
  set last_message_at = new.created_at,
      updated_at      = new.created_at
  where id = new.conversation_id;
  return new;
end;
$$ language plpgsql;

drop trigger if exists on_message_last_update on messages;
create trigger on_message_last_update
  after insert on messages
  for each row execute function update_conversation_last_message();

-- ─────────────────────────────────────────────
-- 7b. Notify org when a customer sends a message
-- ─────────────────────────────────────────────
create or replace function notify_on_new_message()
returns trigger as $$
declare
  v_org_id uuid;
begin
  -- Only fire for inbound customer messages
  if new.role != 'user' then
    return new;
  end if;

  select c.org_id
    into v_org_id
    from conversations conv
    join chatbots c on c.id = conv.chatbot_id
   where conv.id = new.conversation_id
   limit 1;

  if v_org_id is not null then
    insert into notifications (org_id, conversation_id, type, message, priority)
    values (v_org_id, new.conversation_id, 'new_message', 'New message from customer', 'normal');
  end if;

  return new;
end;
$$ language plpgsql;

drop trigger if exists on_new_message_notify on messages;
create trigger on_new_message_notify
  after insert on messages
  for each row execute function notify_on_new_message();

-- ─────────────────────────────────────────────
-- 7c. Notify + log when conversation is escalated
-- ─────────────────────────────────────────────
create or replace function notify_on_escalation()
returns trigger as $$
declare
  v_org_id uuid;
begin
  -- Only act when status transitions TO 'escalated'
  if new.status = 'escalated'
     and (old.status is null or old.status <> 'escalated') then

    select org_id
      into v_org_id
      from chatbots
     where id = new.chatbot_id
     limit 1;

    if v_org_id is not null then
      -- High-priority notification
      insert into notifications (org_id, conversation_id, type, message, priority)
      values (
        v_org_id,
        new.id,
        'escalated',
        'Conversation escalated — requires human attention',
        'high'
      );

      -- Audit event
      insert into chat_events (conversation_id, event_type, event_data)
      values (
        new.id,
        'escalated',
        jsonb_build_object('from_status', old.status, 'to_status', new.status)
      );

      -- Stamp escalation time
      new.escalation_requested_at = now();
    end if;
  end if;

  return new;
end;
$$ language plpgsql;

drop trigger if exists on_conversation_escalated on conversations;
create trigger on_conversation_escalated
  before update on conversations
  for each row execute function notify_on_escalation();

-- ─────────────────────────────────────────────
-- 7d. Log agent assignment changes
-- ─────────────────────────────────────────────
create or replace function log_assignment()
returns trigger as $$
begin
  if new.assigned_agent_id is distinct from old.assigned_agent_id then

    -- Audit trail
    insert into chat_events (conversation_id, event_type, event_by, event_data)
    values (
      new.id,
      'assigned',
      new.assigned_agent_id,
      jsonb_build_object('from_agent', old.assigned_agent_id,
                         'to_agent',   new.assigned_agent_id)
    );

    new.assigned_at = now();

    -- Increment new agent workload
    if new.assigned_agent_id is not null then
      insert into agent_status (agent_id, active_chat_count)
      values (new.assigned_agent_id, 1)
      on conflict (agent_id) do update
        set active_chat_count = agent_status.active_chat_count + 1,
            updated_at        = now();
    end if;

    -- Decrement previous agent workload
    if old.assigned_agent_id is not null then
      update agent_status
         set active_chat_count = greatest(0, active_chat_count - 1),
             updated_at        = now()
       where agent_id = old.assigned_agent_id;
    end if;
  end if;

  return new;
end;
$$ language plpgsql;

drop trigger if exists on_conversation_assigned on conversations;
create trigger on_conversation_assigned
  before update on conversations
  for each row execute function log_assignment();

-- ─────────────────────────────────────────────
-- 7e. Auto-create profile row on new signup
-- ─────────────────────────────────────────────
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, email, role)
  values (new.id, new.email, 'customer')
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();


-- ─────────────────────────────────────────────
-- STEP 8: Row Level Security on new tables
-- ─────────────────────────────────────────────
alter table profiles           enable row level security;
alter table agent_status       enable row level security;
alter table chat_events        enable row level security;
alter table ai_sessions        enable row level security;
alter table conversation_notes enable row level security;
alter table customer_details   enable row level security;

-- Profiles: own row always; admins see all
create policy "profiles_select" on profiles for select using (
  id = auth.uid() or
  exists (select 1 from profiles p where p.id = auth.uid() and p.role in ('admin','super_admin'))
);
create policy "profiles_update_own" on profiles for update using (id = auth.uid());

-- Orgs
create policy "org_access" on organizations for all using (
  owner_id = auth.uid() or
  id in (select org_id from team_members where user_id = auth.uid())
);

-- Chatbots
create policy "chatbot_access" on chatbots for all using (
  org_id in (
    select id from organizations
    where owner_id = auth.uid()
       or id in (select org_id from team_members where user_id = auth.uid())
  )
);

-- Conversations: org access + public widget access
create policy "conversation_org_access" on conversations for all using (
  chatbot_id in (
    select id from chatbots where org_id in (
      select id from organizations
      where owner_id = auth.uid()
         or id in (select org_id from team_members where user_id = auth.uid())
    )
  )
);
create policy "conversation_public_insert" on conversations for insert with check (true);
create policy "conversation_public_select" on conversations for select using (true);

-- Messages: org access + public widget access
create policy "message_org_access" on messages for all using (
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
create policy "message_public_insert" on messages for insert with check (true);
create policy "message_public_select" on messages for select using (true);

-- Notifications: org members or direct target
create policy "notification_access" on notifications for all using (
  org_id in (
    select id from organizations
    where owner_id = auth.uid()
       or id in (select org_id from team_members where user_id = auth.uid())
  )
  or target_user_id = auth.uid()
);

-- Team members
create policy "team_access" on team_members for all using (
  org_id in (select id from organizations where owner_id = auth.uid())
  or user_id = auth.uid()
);

-- Agent status
create policy "agent_status_select" on agent_status for select using (
  agent_id = auth.uid() or
  exists (select 1 from profiles p where p.id = auth.uid() and p.role in ('admin','super_admin'))
);
create policy "agent_status_upsert" on agent_status for all using (agent_id = auth.uid());

-- Chat events (org-scoped)
create policy "chat_events_access" on chat_events for all using (
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

-- AI sessions (org-scoped)
create policy "ai_sessions_access" on ai_sessions for all using (
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

-- Conversation notes (org agents only)
create policy "notes_access" on conversation_notes for all using (
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

-- Customer details (any org member)
create policy "customer_details_access" on customer_details for all using (
  exists (
    select 1 from organizations
    where owner_id = auth.uid()
       or id in (select org_id from team_members where user_id = auth.uid())
  )
);


-- ─────────────────────────────────────────────
-- STEP 9: Realtime publications
-- ─────────────────────────────────────────────
do $$
begin
  -- Only add if not already in the publication
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'chat_events'
  ) then
    alter publication supabase_realtime add table chat_events;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'agent_status'
  ) then
    alter publication supabase_realtime add table agent_status;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'conversation_notes'
  ) then
    alter publication supabase_realtime add table conversation_notes;
  end if;
end$$;


-- ─────────────────────────────────────────────
-- STEP 10: Utility helper functions
-- ─────────────────────────────────────────────

-- Unread notification count for an org
create or replace function get_unread_count(org_uuid uuid)
returns bigint
language sql stable as $$
  select count(*)
  from notifications
  where org_id = org_uuid and read = false;
$$;

-- Open + escalated conversations count for an org
create or replace function get_open_chats_count(org_uuid uuid)
returns bigint
language sql stable as $$
  select count(*)
  from conversations c
  join chatbots cb on cb.id = c.chatbot_id
  where cb.org_id = org_uuid
    and c.status in ('open','escalated');
$$;

-- Mark all notifications + messages as seen for a conversation
create or replace function mark_conversation_seen(conv_id uuid, agent_uuid uuid)
returns void
language plpgsql as $$
begin
  update messages
     set is_seen = true
   where conversation_id = conv_id
     and role = 'user'
     and is_seen = false;

  update notifications
     set read    = true,
         read_at = now()
   where conversation_id = conv_id
     and read = false;
end;
$$;
