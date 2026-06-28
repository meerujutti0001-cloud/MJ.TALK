-- =============================================
-- Fix: infinite recursion in RLS policies
--
-- Cause: organizations RLS references team_members,
--        team_members RLS references organizations → loop.
--
-- Fix: use SECURITY DEFINER functions that bypass RLS
--      so cross-table lookups don't trigger policies.
--
-- Run in Supabase Dashboard → SQL Editor
-- =============================================

-- ─────────────────────────────────────────────
-- 1. Drop ALL recursive policies
-- ─────────────────────────────────────────────
DROP POLICY IF EXISTS "org_access"           ON public.organizations;
DROP POLICY IF EXISTS "org_owner_access"     ON public.organizations;
DROP POLICY IF EXISTS "org_member_access"    ON public.organizations;
DROP POLICY IF EXISTS "chatbot_access"       ON public.chatbots;
DROP POLICY IF EXISTS "conversation_access"  ON public.conversations;
DROP POLICY IF EXISTS "conversation_org_access"    ON public.conversations;
DROP POLICY IF EXISTS "conversation_public_insert" ON public.conversations;
DROP POLICY IF EXISTS "conversation_public_select" ON public.conversations;
DROP POLICY IF EXISTS "conversations_select_public" ON public.conversations;
DROP POLICY IF EXISTS "conversations_insert_public" ON public.conversations;
DROP POLICY IF EXISTS "conversations_update_org"    ON public.conversations;
DROP POLICY IF EXISTS "conversations_delete_org"    ON public.conversations;
DROP POLICY IF EXISTS "message_access"        ON public.messages;
DROP POLICY IF EXISTS "message_org_access"    ON public.messages;
DROP POLICY IF EXISTS "message_public_insert" ON public.messages;
DROP POLICY IF EXISTS "message_public_select" ON public.messages;
DROP POLICY IF EXISTS "messages_select_public" ON public.messages;
DROP POLICY IF EXISTS "messages_insert_public" ON public.messages;
DROP POLICY IF EXISTS "messages_update_org"   ON public.messages;
DROP POLICY IF EXISTS "messages_delete_org"   ON public.messages;
DROP POLICY IF EXISTS "notification_access"   ON public.notifications;
DROP POLICY IF EXISTS "team_access"           ON public.team_members;
DROP POLICY IF EXISTS "team_owner_access"     ON public.team_members;
DROP POLICY IF EXISTS "team_self_access"      ON public.team_members;
DROP POLICY IF EXISTS "team_self_update"      ON public.team_members;
DROP POLICY IF EXISTS "team_members_owner_all"   ON public.team_members;
DROP POLICY IF EXISTS "team_members_self_select" ON public.team_members;
DROP POLICY IF EXISTS "team_members_self_update" ON public.team_members;

-- ─────────────────────────────────────────────
-- 2. Create SECURITY DEFINER helpers
--    These run as the function owner (bypasses RLS),
--    breaking the recursion cycle.
-- ─────────────────────────────────────────────

-- Returns org_ids where the calling user is the owner
CREATE OR REPLACE FUNCTION public.my_owned_org_ids()
RETURNS SETOF UUID
LANGUAGE SQL SECURITY DEFINER STABLE
AS $$
  SELECT id FROM public.organizations WHERE owner_id = auth.uid();
$$;

-- Returns org_ids where the calling user is an accepted agent
CREATE OR REPLACE FUNCTION public.my_agent_org_ids()
RETURNS SETOF UUID
LANGUAGE SQL SECURITY DEFINER STABLE
AS $$
  SELECT org_id FROM public.team_members
  WHERE user_id = auth.uid() AND accepted_at IS NOT NULL;
$$;

-- Returns all org_ids the calling user can access (owner OR agent)
CREATE OR REPLACE FUNCTION public.my_org_ids()
RETURNS SETOF UUID
LANGUAGE SQL SECURITY DEFINER STABLE
AS $$
  SELECT id FROM public.organizations WHERE owner_id = auth.uid()
  UNION ALL
  SELECT org_id FROM public.team_members
  WHERE user_id = auth.uid() AND accepted_at IS NOT NULL;
$$;

-- ─────────────────────────────────────────────
-- 3. Organizations — no recursion
-- ─────────────────────────────────────────────
CREATE POLICY "orgs_owner_all" ON public.organizations
  FOR ALL USING (owner_id = auth.uid());

CREATE POLICY "orgs_agent_select" ON public.organizations
  FOR SELECT USING (id IN (SELECT my_agent_org_ids()));

-- ─────────────────────────────────────────────
-- 4. Chatbots
-- ─────────────────────────────────────────────
CREATE POLICY "chatbots_org_all" ON public.chatbots
  FOR ALL USING (org_id IN (SELECT my_org_ids()));

-- ─────────────────────────────────────────────
-- 5. Conversations — public for widget, org for admin
-- ─────────────────────────────────────────────
CREATE POLICY "convs_select_all"   ON public.conversations FOR SELECT USING (true);
CREATE POLICY "convs_insert_all"   ON public.conversations FOR INSERT WITH CHECK (true);
CREATE POLICY "convs_update_org"   ON public.conversations FOR UPDATE
  USING (chatbot_id IN (SELECT id FROM public.chatbots WHERE org_id IN (SELECT my_org_ids())));
CREATE POLICY "convs_delete_org"   ON public.conversations FOR DELETE
  USING (chatbot_id IN (SELECT id FROM public.chatbots WHERE org_id IN (SELECT my_org_ids())));

-- ─────────────────────────────────────────────
-- 6. Messages — public for widget, org for admin
-- ─────────────────────────────────────────────
CREATE POLICY "msgs_select_all"  ON public.messages FOR SELECT USING (true);
CREATE POLICY "msgs_insert_all"  ON public.messages FOR INSERT WITH CHECK (true);
CREATE POLICY "msgs_update_org"  ON public.messages FOR UPDATE
  USING (conversation_id IN (
    SELECT c.id FROM public.conversations c
    JOIN public.chatbots cb ON cb.id = c.chatbot_id
    WHERE cb.org_id IN (SELECT my_org_ids())
  ));
CREATE POLICY "msgs_delete_org"  ON public.messages FOR DELETE
  USING (conversation_id IN (
    SELECT c.id FROM public.conversations c
    JOIN public.chatbots cb ON cb.id = c.chatbot_id
    WHERE cb.org_id IN (SELECT my_org_ids())
  ));

-- ─────────────────────────────────────────────
-- 7. Notifications
-- ─────────────────────────────────────────────
CREATE POLICY "notifs_org_all" ON public.notifications
  FOR ALL USING (org_id IN (SELECT my_org_ids()) OR target_user_id = auth.uid());

-- ─────────────────────────────────────────────
-- 8. Team members — NO cross-reference to organizations
-- ─────────────────────────────────────────────

-- Owners: full access to their org's team rows
CREATE POLICY "team_owner_all" ON public.team_members
  FOR ALL USING (org_id IN (SELECT my_owned_org_ids()));

-- Members: can read and update only their own row
CREATE POLICY "team_self_read" ON public.team_members
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "team_self_write" ON public.team_members
  FOR UPDATE USING (user_id = auth.uid());

-- ─────────────────────────────────────────────
-- 9. Chatbot-scoped tables (notes, ai_sessions, etc.)
-- ─────────────────────────────────────────────
DROP POLICY IF EXISTS "notes_access"       ON public.conversation_notes;
DROP POLICY IF EXISTS "ai_sessions_access" ON public.ai_sessions;
DROP POLICY IF EXISTS "chat_events_access" ON public.chat_events;

CREATE POLICY "notes_org" ON public.conversation_notes FOR ALL
  USING (conversation_id IN (
    SELECT c.id FROM public.conversations c
    JOIN public.chatbots cb ON cb.id = c.chatbot_id
    WHERE cb.org_id IN (SELECT my_org_ids())
  ));

CREATE POLICY "ai_sessions_org" ON public.ai_sessions FOR ALL
  USING (conversation_id IN (
    SELECT c.id FROM public.conversations c
    JOIN public.chatbots cb ON cb.id = c.chatbot_id
    WHERE cb.org_id IN (SELECT my_org_ids())
  ));

CREATE POLICY "chat_events_org" ON public.chat_events FOR ALL
  USING (conversation_id IN (
    SELECT c.id FROM public.conversations c
    JOIN public.chatbots cb ON cb.id = c.chatbot_id
    WHERE cb.org_id IN (SELECT my_org_ids())
  ));

-- ─────────────────────────────────────────────
-- 10. KB articles
-- ─────────────────────────────────────────────
DROP POLICY IF EXISTS "kb_org_access"  ON public.kb_articles;
DROP POLICY IF EXISTS "kb_public_read" ON public.kb_articles;

CREATE POLICY "kb_org_all"    ON public.kb_articles FOR ALL
  USING (org_id IN (SELECT my_org_ids()));
CREATE POLICY "kb_public_read" ON public.kb_articles FOR SELECT
  USING (is_published = true);
