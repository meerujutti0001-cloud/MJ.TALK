-- =============================================
-- Fix: Messages & conversations not showing in
-- admin inbox or widget after send
--
-- Root cause: deeply nested RLS policies on messages
-- cause Postgres Realtime to silently drop change events
-- because the publication-level row filter evaluation
-- times out or errors — the row is never broadcast.
--
-- Fix: replace all message RLS with flat, fast policies.
-- Run in Supabase Dashboard → SQL Editor
-- =============================================

-- ─────────────────────────────────────────────
-- 1. Drop ALL existing message policies
-- ─────────────────────────────────────────────
DROP POLICY IF EXISTS "message_access"        ON messages;
DROP POLICY IF EXISTS "message_org_access"    ON messages;
DROP POLICY IF EXISTS "message_public_insert" ON messages;
DROP POLICY IF EXISTS "message_public_select" ON messages;

-- ─────────────────────────────────────────────
-- 2. New flat policies
-- ─────────────────────────────────────────────

-- Anyone can SELECT messages (needed for widget realtime + admin realtime)
CREATE POLICY "messages_select_public"
  ON messages FOR SELECT
  USING (true);

-- Anyone can INSERT messages (widget sends user messages; API sends admin/AI)
CREATE POLICY "messages_insert_public"
  ON messages FOR INSERT
  WITH CHECK (true);

-- Only org members can UPDATE messages (e.g. mark is_seen)
CREATE POLICY "messages_update_org"
  ON messages FOR UPDATE
  USING (
    conversation_id IN (
      SELECT c.id FROM conversations c
      JOIN chatbots cb ON cb.id = c.chatbot_id
      WHERE cb.org_id IN (
        SELECT id FROM organizations WHERE owner_id = auth.uid()
        UNION ALL
        SELECT org_id FROM team_members
          WHERE user_id = auth.uid() AND accepted_at IS NOT NULL
      )
    )
  );

-- Only org members can DELETE messages
CREATE POLICY "messages_delete_org"
  ON messages FOR DELETE
  USING (
    conversation_id IN (
      SELECT c.id FROM conversations c
      JOIN chatbots cb ON cb.id = c.chatbot_id
      WHERE cb.org_id IN (
        SELECT id FROM organizations WHERE owner_id = auth.uid()
        UNION ALL
        SELECT org_id FROM team_members
          WHERE user_id = auth.uid() AND accepted_at IS NOT NULL
      )
    )
  );

-- ─────────────────────────────────────────────
-- 3. Also flatten conversations policies for
--    the same realtime reliability reason
-- ─────────────────────────────────────────────
DROP POLICY IF EXISTS "conversation_access"        ON conversations;
DROP POLICY IF EXISTS "conversation_org_access"    ON conversations;
DROP POLICY IF EXISTS "conversation_public_insert" ON conversations;
DROP POLICY IF EXISTS "conversation_public_read"   ON conversations;
DROP POLICY IF EXISTS "conversation_public_select" ON conversations;

-- Public select (widget needs to read conversation status)
CREATE POLICY "conversations_select_public"
  ON conversations FOR SELECT
  USING (true);

-- Public insert (widget creates conversations)
CREATE POLICY "conversations_insert_public"
  ON conversations FOR INSERT
  WITH CHECK (true);

-- Org members can update (assign, status change, etc.)
CREATE POLICY "conversations_update_org"
  ON conversations FOR UPDATE
  USING (
    chatbot_id IN (
      SELECT cb.id FROM chatbots cb
      WHERE cb.org_id IN (
        SELECT id FROM organizations WHERE owner_id = auth.uid()
        UNION ALL
        SELECT org_id FROM team_members
          WHERE user_id = auth.uid() AND accepted_at IS NOT NULL
      )
    )
  );

-- Org members can delete
CREATE POLICY "conversations_delete_org"
  ON conversations FOR DELETE
  USING (
    chatbot_id IN (
      SELECT cb.id FROM chatbots cb
      WHERE cb.org_id IN (
        SELECT id FROM organizations WHERE owner_id = auth.uid()
        UNION ALL
        SELECT org_id FROM team_members
          WHERE user_id = auth.uid() AND accepted_at IS NOT NULL
      )
    )
  );

-- ─────────────────────────────────────────────
-- 4. Fix team_members DELETE for owners
--    (ensure owner can always remove agents)
-- ─────────────────────────────────────────────
DROP POLICY IF EXISTS "team_access"        ON team_members;
DROP POLICY IF EXISTS "team_owner_access"  ON team_members;
DROP POLICY IF EXISTS "team_self_access"   ON team_members;

-- Org owners have full access to their team rows
CREATE POLICY "team_members_owner_all"
  ON team_members FOR ALL
  USING (
    org_id IN (
      SELECT id FROM organizations WHERE owner_id = auth.uid()
    )
  );

-- Members can read and update their own row (for accept-invite flow)
CREATE POLICY "team_members_self_select"
  ON team_members FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "team_members_self_update"
  ON team_members FOR UPDATE
  USING (user_id = auth.uid());

-- ─────────────────────────────────────────────
-- 5. Ensure messages + conversations are in
--    the realtime publication
-- ─────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE messages;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'conversations'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE conversations;
  END IF;
END$$;
