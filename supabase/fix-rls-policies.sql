-- =============================================
-- Fix infinite recursion in RLS policies
-- Run this in your Supabase SQL Editor
-- =============================================

-- Drop the recursive policy on organizations
DROP POLICY IF EXISTS "org_access" ON organizations;

-- Simple policy: owners can access their org
CREATE POLICY "org_owner_access" ON organizations
  FOR ALL USING (owner_id = auth.uid());

-- Separate policy for team members using a security definer function
-- to avoid recursion
CREATE OR REPLACE FUNCTION get_user_org_ids()
RETURNS SETOF uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT org_id FROM team_members WHERE user_id = auth.uid()
$$;

CREATE POLICY "org_member_access" ON organizations
  FOR SELECT USING (
    id IN (SELECT get_user_org_ids())
  );

-- =============================================
-- Fix chatbots policy (also potentially recursive)
-- =============================================
DROP POLICY IF EXISTS "chatbot_access" ON chatbots;

CREATE POLICY "chatbot_access" ON chatbots
  FOR ALL USING (
    org_id IN (
      SELECT id FROM organizations WHERE owner_id = auth.uid()
      UNION
      SELECT get_user_org_ids()
    )
  );

-- =============================================
-- Fix conversations policy
-- =============================================
DROP POLICY IF EXISTS "conversation_access" ON conversations;

CREATE POLICY "conversation_access" ON conversations
  FOR ALL USING (
    chatbot_id IN (
      SELECT id FROM chatbots WHERE org_id IN (
        SELECT id FROM organizations WHERE owner_id = auth.uid()
        UNION
        SELECT get_user_org_ids()
      )
    )
  );

-- =============================================
-- Fix messages policy
-- =============================================
DROP POLICY IF EXISTS "message_access" ON messages;

CREATE POLICY "message_access" ON messages
  FOR ALL USING (
    conversation_id IN (
      SELECT id FROM conversations WHERE chatbot_id IN (
        SELECT id FROM chatbots WHERE org_id IN (
          SELECT id FROM organizations WHERE owner_id = auth.uid()
          UNION
          SELECT get_user_org_ids()
        )
      )
    )
  );

-- =============================================
-- Fix notifications policy
-- =============================================
DROP POLICY IF EXISTS "notification_access" ON notifications;

CREATE POLICY "notification_access" ON notifications
  FOR ALL USING (
    org_id IN (
      SELECT id FROM organizations WHERE owner_id = auth.uid()
      UNION
      SELECT get_user_org_ids()
    )
  );

-- =============================================
-- Fix team_members policy
-- =============================================
DROP POLICY IF EXISTS "team_access" ON team_members;

CREATE POLICY "team_owner_access" ON team_members
  FOR ALL USING (
    org_id IN (SELECT id FROM organizations WHERE owner_id = auth.uid())
  );

CREATE POLICY "team_self_access" ON team_members
  FOR SELECT USING (user_id = auth.uid());
