# Phase 1: Core Chat Flow Implementation Roadmap

**Status**: 🚀 Ready to Implement  
**Priority**: CRITICAL  
**Timeline**: 3-5 days  
**Goal**: Make message lifecycle 100% reliable

---

## Overview

Transform MJ.TALK from demo to production-ready SaaS by fixing the core chat flow. The main issue is that when users click "Talk to Human Agent", messages don't reliably reach admins.

---

## Current Problems

1. ❌ User requests human agent → admin doesn't see it
2. ❌ No notifications sent to admin
3. ❌ Chat room/ticket doesn't open
4. ❌ Messages don't appear in admin panel
5. ❌ No proper conversation lifecycle management

---

## Solution Architecture

### Database Schema Enhancement

**New Migration Created**: `supabase/migrations/001_phase1_enhanced_schema.sql`

#### Enhanced Tables

**1. conversations** (enhanced)
```sql
- assigned_agent_id (NEW) - which agent handles this
- priority (NEW) - low/medium/high
- source (NEW) - widget/manual/ai_handoff/human_request
- subject (NEW) - conversation topic
- last_message_at (NEW) - for sorting
- escalation_requested_at (NEW) - when user asked for human
- assigned_at (NEW) - when agent took it
- closed_at (NEW) - when resolved
```

**2. messages** (enhanced)
```sql
- sender_id (NEW) - references auth.users
- message_type (NEW) - text/image/file/system
- is_seen (NEW) - read status
- delivery_status (NEW) - pending/sent/delivered/failed
- metadata (NEW) - extra data as JSON
```

**3. profiles** (NEW)
```sql
- User roles: customer/agent/admin/super_admin
- Status: active/inactive/suspended
- Extended user information
```

**4. agent_status** (NEW)
```sql
- online_status: online/away/busy/offline
- last_active timestamp
- active_chat_count: how many chats agent handling
- max_concurrent_chats: capacity limit
```

**5. chat_events** (NEW - Audit Trail)
```sql
- Event types: created/assigned/escalated/closed/reopened/ai_to_human
- Complete event log for compliance
```

**6. ai_sessions** (NEW)
```sql
- Track AI interactions
- detected_intent, confidence_score
- escalation_reason
- ai_summary for agent handoff
```

**7. conversation_notes** (NEW)
```sql
- Internal agent-only notes
- Not visible to customers
```

**8. customer_details** (NEW)
```sql
- Extended customer profiles
- first_seen_at, last_seen_at
- total_conversations count
- tags for categorization
```

#### New Automated Triggers

1. **update_conversation_last_message()** - Auto-update last message timestamp
2. **notify_on_new_message()** - Create notification when user sends message
3. **notify_on_escalation()** - High-priority alert when chat escalated
4. **log_assignment()** - Track agent assignments
5. **handle_new_user()** - Auto-create profile on signup

---

## Expected Flow (Step-by-Step)

### Step 1: User Requests Human Agent

**Widget Action**:
```typescript
// User clicks "Talk to Human Agent" button
const response = await fetch('/api/chat/escalate', {
  method: 'POST',
  body: JSON.stringify({
    conversationId,
    sessionId,
    message: "I need human assistance",
    source: 'human_request'
  })
});
```

**Database Actions**:
```sql
-- Create or update conversation
INSERT INTO conversations (
  chatbot_id,
  session_id,
  visitor_name,
  visitor_email,
  status,           -- 'escalated'
  source,           -- 'human_request'
  priority,         -- 'medium'
  escalation_requested_at
) VALUES (...);

-- Insert user message
INSERT INTO messages (
  conversation_id,
  role,             -- 'user'
  content,
  message_type,     -- 'text'
  delivery_status   -- 'sent'
) VALUES (...);
```

**Automatic Triggers Fire**:
1. `update_conversation_last_message()` - Updates `last_message_at`
2. `notify_on_new_message()` - Creates notification
3. `notify_on_escalation()` - Creates high-priority escalation alert
4. Chat event logged in `chat_events` table

---

### Step 2: Admin Gets Notified

**Notification Created**:
```sql
INSERT INTO notifications (
  org_id,
  conversation_id,
  message_id,
  type,             -- 'escalated'
  message,          -- 'Conversation escalated - requires human attention'
  priority,         -- 'high'
  read              -- false
) VALUES (...);
```

**Real-time Push**:
- Supabase Realtime broadcasts notification
- Admin dashboard sidebar updates unread badge
- Sound notification plays (if enabled)
- Toast/alert appears

---

### Step 3: Conversation Appears in Admin Inbox

**Admin Dashboard Query**:
```sql
SELECT 
  c.*,
  cb.name as chatbot_name,
  cb.widget_color,
  (SELECT COUNT(*) FROM messages m WHERE m.conversation_id = c.id AND m.role = 'user' AND m.is_seen = false) as unread_count,
  (SELECT content FROM messages m WHERE m.conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message
FROM conversations c
JOIN chatbots cb ON cb.id = c.chatbot_id
WHERE cb.org_id = :org_id
  AND c.status IN ('open', 'escalated')
ORDER BY c.last_message_at DESC;
```

**Inbox Display**:
- Customer name and email
- Last message preview
- Unread badge (count)
- Waiting time (e.g., "2 minutes ago")
- Status tag (Open/Escalated)
- Priority indicator (if high)
- Assigned agent (if any)

---

### Step 4: Admin Opens Chat

**Actions**:
1. Click conversation in left panel
2. Load full message history
3. Mark messages as seen
4. Load customer details in right sidebar

**API Call**:
```typescript
// Mark as seen
await fetch('/api/conversations/mark-seen', {
  method: 'POST',
  body: JSON.stringify({ conversationId })
});

// This calls: mark_conversation_seen(conv_id, agent_uuid)
```

**Database Updates**:
```sql
-- Mark all user messages as seen
UPDATE messages
SET is_seen = true
WHERE conversation_id = :conv_id 
  AND role = 'user' 
  AND is_seen = false;

-- Mark notifications as read
UPDATE notifications
SET read = true, read_at = now()
WHERE conversation_id = :conv_id 
  AND read = false;
```

---

### Step 5: Admin Replies

**Admin Panel Action**:
```typescript
// Admin types reply and hits send
const response = await fetch('/api/admin/reply', {
  method: 'POST',
  body: JSON.stringify({
    conversationId,
    message: "Hello! How can I help you?",
    agentId: currentUser.id
  })
});
```

**Database Actions**:
```sql
-- Insert admin message
INSERT INTO messages (
  conversation_id,
  role,             -- 'admin'
  sender_id,        -- agent's user ID
  content,
  message_type,     -- 'text'
  delivery_status   -- 'sent'
) VALUES (...);

-- Update conversation
UPDATE conversations
SET 
  last_message_at = now(),
  updated_at = now()
WHERE id = :conv_id;
```

**Real-time Push to User**:
- Widget receives message via Supabase Realtime
- Message appears in user's chat
- Typing indicator disappears
- Sound plays (if enabled)

---

## Implementation Checklist

### Phase 1.1: Database Migration (Day 1)

- [x] ✅ Create enhanced schema migration file
- [ ] Test migration on local Supabase
- [ ] Run migration on production Supabase
- [ ] Verify all tables created
- [ ] Verify all triggers working
- [ ] Test RLS policies

**Commands**:
```bash
# Apply migration locally
supabase db push

# Apply to production
# Via Supabase Dashboard > SQL Editor > paste migration
```

---

### Phase 1.2: API Endpoints (Day 1-2)

#### New Endpoints Needed

**1. POST /api/chat/escalate**
```typescript
// Handle human agent request
// - Create/update conversation with status='escalated'
// - Insert user message
// - Trigger notifications
// - Return conversation ID
```

**2. POST /api/conversations/mark-seen**
```typescript
// Mark conversation as seen by agent
// - Call mark_conversation_seen() function
// - Return success
```

**3. GET /api/conversations/inbox**
```typescript
// Get all active conversations for org
// - Filter by status (open, escalated)
// - Include unread counts
// - Include last message preview
// - Order by last_message_at DESC
```

**4. POST /api/admin/assign**
```typescript
// Assign conversation to agent
// - Update assigned_agent_id
// - Create chat event
// - Send notification to agent
```

**5. POST /api/conversations/update-status**
```typescript
// Update conversation status
// - Change status (open/escalated/resolved)
// - Log event
// - Send notifications if needed
```

---

### Phase 1.3: Widget Enhancement (Day 2)

#### Add "Talk to Human" Button

**File**: `src/components/widget/widget-app.tsx`

```typescript
const handleEscalate = async () => {
  setIsTyping(true);
  try {
    const response = await fetch(`${getApiBase()}/api/chat/escalate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chatbotId: config.id,
        sessionId,
        conversationId,
        visitorName: preChatData.name,
        visitorEmail: preChatData.email,
        message: "I would like to speak with a human agent",
        pageUrl: window.location.href,
        browserInfo: navigator.userAgent
      })
    });
    
    const data = await response.json();
    if (data.conversationId) {
      setConversationId(data.conversationId);
      setIsEscalated(true);
      
      // Add system message
      const systemMsg: UIMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: '✓ A support agent has been notified. Someone will assist you shortly.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, systemMsg]);
    }
  } catch (error) {
    setError('Failed to connect to agent');
  } finally {
    setIsTyping(false);
  }
};
```

**UI Addition**:
```tsx
{/* "Talk to Human" button */}
{!isEscalated && (
  <button
    onClick={handleEscalate}
    className="..."
  >
    <User className="w-4 h-4" />
    Talk to Human Agent
  </button>
)}

{/* Escalated status indicator */}
{isEscalated && (
  <div className="px-3 py-2 bg-green-50 border border-green-200 rounded-lg">
    <p className="text-xs text-green-700">
      ✓ Agent notified - you'll receive a response soon
    </p>
  </div>
)}
```

---

### Phase 1.4: Admin Dashboard Enhancement (Day 3)

#### Conversation Inbox Component

**File**: `src/components/dashboard/conversation-inbox.tsx` (enhance existing)

**Add**:
1. Filters (All/Unassigned/My Chats/Escalated/Closed)
2. Status badges with colors
3. Unread count badges
4. Waiting time indicator
5. Priority indicators
6. Assignment buttons

**Example Filter UI**:
```tsx
const filters = [
  { id: 'all', label: 'All', count: conversations.length },
  { id: 'unassigned', label: 'Unassigned', count: unassignedCount },
  { id: 'mine', label: 'Assigned to Me', count: myChatsCount },
  { id: 'escalated', label: 'Escalated', count: escalatedCount, color: 'red' },
  { id: 'high', label: 'High Priority', count: highPriorityCount, color: 'orange' }
];
```

#### Right Sidebar: Customer Details

**Add customer info panel**:
```tsx
<div className="customer-details">
  <h3>Customer Details</h3>
  <div>
    <label>Name</label>
    <p>{conversation.visitor_name || 'Anonymous'}</p>
  </div>
  <div>
    <label>Email</label>
    <p>{conversation.visitor_email || 'Not provided'}</p>
  </div>
  <div>
    <label>First Seen</label>
    <p>{formatDate(customerDetails.first_seen_at)}</p>
  </div>
  <div>
    <label>Previous Chats</label>
    <p>{customerDetails.total_conversations}</p>
  </div>
  <div>
    <label>Tags</label>
    <div className="tags">
      {customerDetails.tags.map(tag => (
        <span key={tag} className="tag">{tag}</span>
      ))}
    </div>
  </div>
</div>
```

---

### Phase 1.5: Real-time Notifications (Day 3-4)

#### Admin Notification System

**File**: `src/components/dashboard/notification-provider.tsx` (new)

```typescript
'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useToast } from '@/hooks/use-toast';

export function NotificationProvider({ 
  children, 
  orgId, 
  userId 
}: { 
  children: React.ReactNode;
  orgId: string;
  userId: string;
}) {
  const { toast } = useToast();
  const [unreadCount, setUnreadCount] = useState(0);
  
  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    
    // Subscribe to new notifications
    const channel = supabase
      .channel(`notifications:${orgId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `org_id=eq.${orgId}`
        },
        (payload) => {
          const notification = payload.new;
          
          // Play sound
          playNotificationSound();
          
          // Show toast
          toast({
            title: getNotificationTitle(notification.type),
            description: notification.message,
            variant: notification.priority === 'high' ? 'destructive' : 'default'
          });
          
          // Update unread count
          setUnreadCount(count => count + 1);
        }
      )
      .subscribe();
    
    // Fetch initial unread count
    supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('org_id', orgId)
      .eq('read', false)
      .then(({ count }) => setUnreadCount(count || 0));
    
    return () => {
      channel.unsubscribe();
    };
  }, [orgId, toast]);
  
  return (
    <NotificationContext.Provider value={{ unreadCount, setUnreadCount }}>
      {children}
    </NotificationContext.Provider>
  );
}

function playNotificationSound() {
  const audio = new Audio('/notification.mp3');
  audio.volume = 0.5;
  audio.play().catch(() => {});
}

function getNotificationTitle(type: string) {
  const titles = {
    'new_chat': '💬 New Chat',
    'new_message': '📨 New Message',
    'escalated': '🚨 Chat Escalated',
    'flagged': '🚩 Chat Flagged',
    'assigned': '✓ Chat Assigned'
  };
  return titles[type as keyof typeof titles] || 'Notification';
}
```

---

### Phase 1.6: Testing (Day 4-5)

#### Test Scenarios

**Test 1: New Chat Creation**
1. Open widget on test page
2. Fill pre-chat form (if enabled)
3. Send first message
4. ✓ Verify conversation created in database
5. ✓ Verify message saved
6. ✓ Verify notification created
7. ✓ Verify appears in admin inbox

**Test 2: Human Agent Request**
1. Chat with AI first
2. Click "Talk to Human Agent"
3. ✓ Verify conversation status → 'escalated'
4. ✓ Verify high-priority notification created
5. ✓ Verify chat_events log entry
6. ✓ Verify appears prominently in admin inbox
7. ✓ Verify widget shows "Agent notified" message

**Test 3: Admin Response**
1. Admin opens escalated chat
2. ✓ Verify messages marked as seen
3. ✓ Verify unread count decreases
4. Admin types reply and sends
5. ✓ Verify message saved with admin role
6. ✓ Verify widget receives message in real-time
7. ✓ Verify sound plays in widget

**Test 4: Assignment**
1. Admin clicks "Assign to Me"
2. ✓ Verify assigned_agent_id updated
3. ✓ Verify chat_events logged
4. ✓ Verify agent_status.active_chat_count incremented
5. ✓ Filter "Assigned to Me" shows conversation

**Test 5: Multiple Conversations**
1. Create 3 conversations from different sessions
2. ✓ Verify all appear in inbox
3. ✓ Verify correct ordering (newest first)
4. ✓ Verify no messages mixed between conversations
5. ✓ Verify unread counts accurate

**Test 6: Real-time Sync**
1. Open admin dashboard in 2 tabs
2. Reply from tab 1
3. ✓ Verify tab 2 updates without refresh
4. Close chat in tab 1
5. ✓ Verify tab 2 shows updated status

---

## Success Metrics

After Phase 1 implementation, these must work 100%:

1. ✅ User sends message → Appears in admin inbox within 2 seconds
2. ✅ User requests human → Admin gets high-priority notification
3. ✅ Admin replies → User receives instantly
4. ✅ Unread counts accurate
5. ✅ No messages lost
6. ✅ No conversations mixed up
7. ✅ Real-time updates work
8. ✅ Notifications reliable
9. ✅ Assignment system functional
10. ✅ Status changes tracked

---

## Files to Create/Modify

### New Files
- `supabase/migrations/001_phase1_enhanced_schema.sql` ✅
- `src/app/api/chat/escalate/route.ts`
- `src/app/api/conversations/mark-seen/route.ts`
- `src/app/api/conversations/inbox/route.ts`
- `src/app/api/admin/assign/route.ts`
- `src/components/dashboard/notification-provider.tsx`
- `src/components/dashboard/customer-details-panel.tsx`
- `src/hooks/use-notifications.ts`

### Modified Files
- `src/components/widget/widget-app.tsx` (add escalation)
- `src/components/dashboard/conversation-inbox.tsx` (enhance)
- `src/app/dashboard/(main)/conversations/page.tsx` (add filters)
- `src/app/dashboard/(main)/layout.tsx` (wrap with NotificationProvider)

---

## Next Steps

After Phase 1 is complete:
- **Phase 2**: Enhanced admin dashboard (filters, assignment UI)
- **Phase 3**: Real-time typing indicators & presence
- **Phase 4**: AI + Human hybrid workflow
- **Phase 5**: Analytics dashboard with real metrics
- **Phase 6**: Trust & professionalism fixes
- **Phase 7**: Role-based access control
- **Phase 8**: UI polish
- **Phase 9**: End-to-end testing
- **Phase 10**: Production deployment

---

**Ready to start implementation?** Let's begin with applying the database migration!

