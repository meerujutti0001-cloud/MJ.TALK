-- =============================================
-- PHASE 1: Enhanced Schema for Professional Chat System
-- =============================================

-- Drop existing policies to recreate them properly
drop policy if exists "org_access" on organizations;
drop policy if exists "chatbot_access" on chatbots;
drop policy if exists "conversation_access" on conversations;
drop policy if exists "public_conversation_insert" on conversations;
drop policy if exists "public_conversation_read" on conversations;
drop policy if exists "public_message_insert" on messages;
drop policy if exists "public_message_read" on messages;
drop policy if exists "message_access" on messages;
drop policy if exists "notification_access" on notifications;
drop policy if exists "team_access" on team_members;

-- Add missing columns to conversations table
alter table conversations 
  add column if not exists assigned_agent_id uuid references auth.users(id) on delete set null,
  add column if not exists priority text check (priority in ('low', 'medium', 'high')) default 'medium',
  add column if not exists source text check (source in ('widget', 'manual', 'ai_handoff', 'human_request')) default 'widget',
  add column if not exists subject text,
  add column if not exists last_message_at timestamptz default now(),
  add column if not exists escalation_requested_at timestamptz,
  add column if not exists assigned_at timestamptz,
  add column if not exists closed_at timestamptz;

-- Add missing columns to messages table
alter table messages
  add column if not exists sender_id uuid references auth.users(id) on delete set null,
  add column if not exists message_type text check (message_type in ('text', 'image', 'file', 'system')) default 'text',
  add column if not exists is_seen boolean default false,
  add column if not exists delivery_status text check (delivery_status in ('pending', 'sent', 'delivered', 'failed')) default 'sent',
  add column if not exists metadata jsonb default '{}'::jsonb;

-- Profiles table (for user roles and status)
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  full_name text,
  role text check (role in ('customer', 'agent', 'admin', 'super_admin')) default 'customer',
  status text check (status in ('active', 'inactive', 'suspended')) default 'active',
  avatar_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Agent status table (for online/offline tracking)
create table if not exists agent_status (
  agent_id uuid primary key references auth.users(id) on delete cascade,
  online_status text check (online_status in ('online', 'away', 'busy', 'offline')) default 'offline',
  last_active timestamptz default now(),
  active_chat_count int default 0,
  max_concurrent_chats int default 5,
  updated_at timestamptz default now()
);

-- Chat events table (for audit trail)
create table if not exists chat_events (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references conversations(id) on delete cascade not null,
  event_type text check (event_type in ('created', 'assigned', 'escalated', 'closed', 'reopened', 'ai_to_human', 'transferred', 'note_added')) not null,
  event_by uuid references auth.users(id) on delete set null,
  event_data jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

-- AI sessions table (for tracking AI interactions)
create table if not exists ai_sessions (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references conversations(id) on delete cascade not null,
  detected_intent text,
  ai_confidence_score numeric(3,2),
  escalated_to_human boolean default false,
  escalation_reason text,
  ai_summary text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Internal notes table (agent-only notes)
create table if not exists conversation_notes (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references conversations(id) on delete cascade not null,
  agent_id uuid references auth.users(id) on delete cascade not null,
  note_text text not null,
  created_at timestamptz default now()
);

-- Customer details extended
create table if not exists customer_details (
  id uuid primary key default gen_random_uuid(),
  visitor_email text unique,
  visitor_name text,
  first_seen_at timestamptz default now(),
  last_seen_at timestamptz default now(),
  total_conversations int default 0,
  tags text[] default '{}',
  metadata jsonb default '{}'::jsonb
);

-- Enhanced notifications with better typing
alter table notifications 
  add column if not exists target_user_id uuid references auth.users(id) on delete cascade,
  add column if not exists message_id uuid references messages(id) on delete cascade,
  add column if not exists priority text check (priority in ('low', 'normal', 'high', 'urgent')) default 'normal',
  add column if not exists action_url text,
  add column if not exists read_at timestamptz;

-- Update notification type check
alter table notifications 
  drop constraint if exists notifications_type_check,
  add constraint notifications_type_check check (
    type in ('new_chat', 'new_message', 'escalated', 'flagged', 'idle', 'assigned', 'mention')
  );

-- =============================================
-- Indexes for Performance
-- =============================================

create index if not exists idx_conversations_status on conversations(status);
create index if not exists idx_conversations_assigned_agent on conversations(assigned_agent_id);
create index if not exists idx_conversations_chatbot on conversations(chatbot_id);
create index if not exists idx_conversations_created_at on conversations(created_at desc);
create index if not exists idx_conversations_last_message_at on conversations(last_message_at desc);
create index if not exists idx_messages_conversation on messages(conversation_id);
create index if not exists idx_messages_created_at on messages(created_at);
create index if not exists idx_notifications_target_user on notifications(target_user_id) where read = false;
create index if not exists idx_notifications_org on notifications(org_id) where read = false;
create index if not exists idx_chat_events_conversation on chat_events(conversation_id);
create index if not exists idx_agent_status_online on agent_status(online_status) where online_status != 'offline';

-- =============================================
-- Functions & Triggers
-- =============================================

-- Function to update last_message_at on new message
create or replace function update_conversation_last_message()
returns trigger as $$
begin
  update conversations
  set 
    last_message_at = new.created_at,
    updated_at = new.created_at
  where id = new.conversation_id;
  return new;
end;
$$ language plpgsql;

drop trigger if exists on_message_last_update on messages;
create trigger on_message_last_update
  after insert on messages
  for each row execute function update_conversation_last_message();

-- Function to create notification on new message
create or replace function notify_on_new_message()
returns trigger as $$
declare
  v_org_id uuid;
  v_chatbot record;
begin
  -- Only create notification for user messages (not admin/system replies)
  if new.role = 'user' then
    -- Get org_id from conversation -> chatbot -> org
    select c.org_id, c.name into v_org_id, v_chatbot
    from conversations conv
    join chatbots c on c.id = conv.chatbot_id
    where conv.id = new.conversation_id;
    
    if v_org_id is not null then
      insert into notifications (
        org_id,
        conversation_id,
        message_id,
        type,
        message,
        priority
      ) values (
        v_org_id,
        new.conversation_id,
        new.id,
        'new_message',
        'New message from customer',
        'normal'
      );
    end if;
  end if;
  
  return new;
end;
$$ language plpgsql;

drop trigger if exists on_new_message_notify on messages;
create trigger on_new_message_notify
  after insert on messages
  for each row execute function notify_on_new_message();

-- Function to create notification on escalation
create or replace function notify_on_escalation()
returns trigger as $$
declare
  v_org_id uuid;
begin
  -- Check if status changed to 'escalated'
  if new.status = 'escalated' and (old.status is null or old.status != 'escalated') then
    -- Get org_id
    select org_id into v_org_id
    from chatbots
    where id = new.chatbot_id;
    
    if v_org_id is not null then
      -- Create high priority notification
      insert into notifications (
        org_id,
        conversation_id,
        type,
        message,
        priority
      ) values (
        v_org_id,
        new.id,
        'escalated',
        'Conversation escalated - requires human attention',
        'high'
      );
      
      -- Log event
      insert into chat_events (
        conversation_id,
        event_type,
        event_data
      ) values (
        new.id,
        'escalated',
        jsonb_build_object('from_status', old.status, 'to_status', new.status)
      );
      
      -- Update escalation timestamp
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

-- Function to log assignment events
create or replace function log_assignment()
returns trigger as $$
begin
  if new.assigned_agent_id is distinct from old.assigned_agent_id then
    insert into chat_events (
      conversation_id,
      event_type,
      event_by,
      event_data
    ) values (
      new.id,
      'assigned',
      new.assigned_agent_id,
      jsonb_build_object(
        'from_agent', old.assigned_agent_id,
        'to_agent', new.assigned_agent_id
      )
    );
    
    new.assigned_at = now();
    
    -- Update agent active chat count
    if new.assigned_agent_id is not null then
      insert into agent_status (agent_id, active_chat_count)
      values (new.assigned_agent_id, 1)
      on conflict (agent_id) 
      do update set 
        active_chat_count = agent_status.active_chat_count + 1,
        updated_at = now();
    end if;
    
    if old.assigned_agent_id is not null then
      update agent_status
      set 
        active_chat_count = greatest(0, active_chat_count - 1),
        updated_at = now()
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

-- Function to auto-create profile on user signup
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

-- =============================================
-- Enhanced RLS Policies
-- =============================================

-- Enable RLS on new tables
alter table profiles enable row level security;
alter table agent_status enable row level security;
alter table chat_events enable row level security;
alter table ai_sessions enable row level security;
alter table conversation_notes enable row level security;
alter table customer_details enable row level security;

-- Profiles: users can read own, admins can read all
create policy "profiles_select" on profiles for select using (
  id = auth.uid() or
  exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'super_admin'))
);

create policy "profiles_update_own" on profiles for update using (id = auth.uid());

-- Organizations: owner and team members
create policy "org_access" on organizations for all using (
  owner_id = auth.uid() or
  id in (select org_id from team_members where user_id = auth.uid())
);

-- Chatbots: org members
create policy "chatbot_access" on chatbots for all using (
  org_id in (
    select id from organizations
    where owner_id = auth.uid()
    or id in (select org_id from team_members where user_id = auth.uid())
  )
);

-- Conversations: org members can see all, public can create/read own
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

-- Messages: org members + public
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

-- Notifications: org members
create policy "notification_access" on notifications for all using (
  org_id in (
    select id from organizations
    where owner_id = auth.uid()
    or id in (select org_id from team_members where user_id = auth.uid())
  ) or target_user_id = auth.uid()
);

-- Team members: org access
create policy "team_access" on team_members for all using (
  org_id in (select id from organizations where owner_id = auth.uid())
  or user_id = auth.uid()
);

-- Agent status: agents can update own, admins can see all
create policy "agent_status_select" on agent_status for select using (
  agent_id = auth.uid() or
  exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'super_admin'))
);

create policy "agent_status_update" on agent_status for all using (agent_id = auth.uid());

-- Chat events: org members
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

-- AI sessions: org members
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

-- Conversation notes: only org agents/admins
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

-- Customer details: org members
create policy "customer_details_access" on customer_details for all using (
  exists (
    select 1 from organizations
    where owner_id = auth.uid()
    or id in (select org_id from team_members where user_id = auth.uid())
  )
);

-- =============================================
-- Realtime Publications
-- =============================================

-- Add new tables to realtime
alter publication supabase_realtime add table chat_events;
alter publication supabase_realtime add table agent_status;
alter publication supabase_realtime add table conversation_notes;

-- =============================================
-- Helper Functions for Application
-- =============================================

-- Function to get unread count for org
create or replace function get_unread_count(org_uuid uuid)
returns bigint as $$
  select count(*)
  from notifications
  where org_id = org_uuid and read = false;
$$ language sql stable;

-- Function to get open conversations count
create or replace function get_open_chats_count(org_uuid uuid)
returns bigint as $$
  select count(*)
  from conversations c
  join chatbots cb on cb.id = c.chatbot_id
  where cb.org_id = org_uuid and c.status in ('open', 'escalated');
$$ language sql stable;

-- Function to mark conversation as seen by agent
create or replace function mark_conversation_seen(conv_id uuid, agent_uuid uuid)
returns void as $$
begin
  update messages
  set is_seen = true
  where conversation_id = conv_id and role = 'user' and is_seen = false;
  
  update notifications
  set read = true, read_at = now()
  where conversation_id = conv_id and read = false;
end;
$$ language plpgsql;

