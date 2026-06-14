-- =============================================
-- Performance Optimization for MJ.TALK Platform
-- =============================================

-- Add indexes for faster queries on purchase_requests
CREATE INDEX IF NOT EXISTS idx_purchase_requests_plan_type ON purchase_requests(plan_type);
CREATE INDEX IF NOT EXISTS idx_purchase_requests_company_name ON purchase_requests(company_name);
CREATE INDEX IF NOT EXISTS idx_purchase_requests_status_created ON purchase_requests(status, created_at DESC);

-- Add indexes for conversations
CREATE INDEX IF NOT EXISTS idx_conversations_chatbot_id_status ON conversations(chatbot_id, status);
CREATE INDEX IF NOT EXISTS idx_conversations_session_id ON conversations(session_id);
CREATE INDEX IF NOT EXISTS idx_conversations_status_updated ON conversations(status, updated_at DESC);

-- Add indexes for messages
CREATE INDEX IF NOT EXISTS idx_messages_conversation_created ON messages(conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_role ON messages(role);

-- Add indexes for notifications
CREATE INDEX IF NOT EXISTS idx_notifications_org_read ON notifications(org_id, read);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);

-- Add indexes for chatbots
CREATE INDEX IF NOT EXISTS idx_chatbots_org_status ON chatbots(org_id, status);

-- Add indexes for team_members
CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_team_members_org_accepted ON team_members(org_id, accepted_at);

-- Optimize profiles table
CREATE INDEX IF NOT EXISTS idx_profiles_email_role ON profiles(email, role);

-- Add composite index for faster admin checks
CREATE INDEX IF NOT EXISTS idx_organizations_owner_created ON organizations(owner_id, created_at DESC);

-- Analyze tables for query optimization
ANALYZE purchase_requests;
ANALYZE conversations;
ANALYZE messages;
ANALYZE notifications;
ANALYZE chatbots;
ANALYZE organizations;
ANALYZE team_members;
ANALYZE profiles;

-- Add helpful comments
COMMENT ON INDEX idx_purchase_requests_status_created IS 'Optimizes admin dashboard queries by status and date';
COMMENT ON INDEX idx_conversations_chatbot_id_status IS 'Speeds up conversation filtering by chatbot and status';
COMMENT ON INDEX idx_messages_conversation_created IS 'Optimizes message loading in conversations';
COMMENT ON INDEX idx_notifications_org_read IS 'Speeds up unread notification counts';

-- Vacuum tables to reclaim space and update statistics
VACUUM ANALYZE purchase_requests;
VACUUM ANALYZE conversations;
VACUUM ANALYZE messages;
VACUUM ANALYZE notifications;
