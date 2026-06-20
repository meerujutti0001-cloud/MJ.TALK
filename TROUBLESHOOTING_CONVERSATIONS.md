# 🔧 Troubleshooting: Conversations Not Appearing

## Issue 1: No Conversations Showing in Dashboard

### Why This Happens
Conversations are **customer-initiated** through the chat widget embedded on your website. If you don't see conversations, it's because:

1. ✅ **No customers have used the widget yet** (most common)
2. ⚠️ Widget not properly embedded
3. ⚠️ Database permissions issue
4. ⚠️ Chatbot not active

---

## Quick Diagnosis

### Step 1: Check if You Have Any Chatbots
```
1. Go to /dashboard/chatbots
2. Do you see at least one chatbot?
3. Is the status "active"?
```

**If NO chatbots:** Create one first!
**If chatbot is "inactive":** Click Configure → Set to "active"

---

### Step 2: Test the Widget Yourself

#### Option A: Test on Your Website
```
1. Go to /dashboard/chatbots
2. Click your chatbot
3. Click "Embed" tab
4. Copy the embed code
5. Paste it into your website before </body>
6. Visit your website
7. Click the chat button
8. Send a test message
9. Go back to /dashboard/conversations
10. You should now see the conversation!
```

#### Option B: Test Without a Website (Quick)
```
1. Create a file: test-widget.html
2. Paste this code:

<!DOCTYPE html>
<html>
<head>
  <title>Test Chat Widget</title>
</head>
<body>
  <h1>Test Page</h1>
  
  <script>
    window.SupportAIConfig = { 
      chatbotId: "YOUR_CHATBOT_ID_HERE", 
      apiUrl: "http://localhost:3000"  // or your production URL
    };
  </script>
  <script src="http://localhost:3000/widget.js"></script>
</body>
</html>

3. Replace YOUR_CHATBOT_ID_HERE with your actual chatbot ID
4. Open test-widget.html in browser
5. Send a message
6. Check /dashboard/conversations
```

---

### Step 3: Check Database Permissions

If conversations still don't show, check database:

```sql
-- Run this in Supabase SQL Editor
SELECT * FROM conversations ORDER BY created_at DESC LIMIT 10;
```

**If you see data:** Permission issue  
**If no data:** No conversations have been created yet

---

## Issue 2: Starting Conversations Manually (Admin-Initiated)

### Current Behavior
The platform is designed for **customer-initiated** conversations only. Admins can:
- ✅ View conversations
- ✅ Reply to conversations
- ✅ Change status
- ❌ Start new conversations

### Why?
This is standard for customer support chatbots:
- Customers start conversations via widget
- Admins respond via dashboard
- Similar to: Intercom, Drift, tawk.to

---

## Solution: Add Manual Conversation Creation (Optional)

If you need to start conversations manually, I can add this feature:

### What It Would Include:
1. "New Conversation" button in conversations panel
2. Modal to enter:
   - Visitor name
   - Visitor email (optional)
   - Initial message
3. Creates conversation + first message
4. Appears in inbox immediately

### Would You Like This Feature?
Let me know and I'll implement it in ~30 minutes.

---

## Most Common Issues & Fixes

### Issue: "No conversations" message
**Fix:** Embed widget and test it yourself

### Issue: Widget not appearing on website
**Fix:** 
1. Check embed code is before `</body>`
2. Check chatbot ID is correct
3. Check chatbot status is "active"
4. Check browser console for errors (F12)

### Issue: Conversations visible but can't open
**Fix:**
1. Check database RLS policies
2. Verify you're logged in as org owner/member
3. Check browser console for errors

### Issue: Can see other org's conversations
**Fix:** 
1. This shouldn't happen (security issue)
2. Check RLS policies are applied
3. Run `supabase/fix-rls-policies.sql`

---

## Testing Checklist

Use this to verify everything works:

### Pre-Test
- [ ] At least one chatbot exists
- [ ] Chatbot status is "active"
- [ ] Embed code copied correctly

### Widget Test
- [ ] Widget button appears on page
- [ ] Click opens chat window
- [ ] Can type message
- [ ] Can send message
- [ ] AI responds
- [ ] No errors in console

### Dashboard Test
- [ ] Conversation appears in /dashboard/conversations
- [ ] Can click to open conversation
- [ ] Messages display correctly
- [ ] Can send admin reply
- [ ] Real-time updates work

---

## Quick Debug Commands

### Check if widget is loaded:
```javascript
// Open browser console on your site (F12)
console.log(window.SupportAI);  // Should show {open: function, close: function}
```

### Check if chatbot config loads:
```javascript
// On widget page
fetch('/api/widget-config?id=YOUR_CHATBOT_ID')
  .then(r => r.json())
  .then(d => console.log(d));
```

### Check database connection:
```sql
-- In Supabase SQL Editor
SELECT COUNT(*) FROM conversations;
SELECT COUNT(*) FROM chatbots;
SELECT COUNT(*) FROM messages;
```

---

## Still Not Working?

### Check These:

1. **Environment Variables**
```env
NEXT_PUBLIC_SUPABASE_URL=...  ✅ Set?
NEXT_PUBLIC_SUPABASE_ANON_KEY=...  ✅ Set?
SUPABASE_SERVICE_ROLE_KEY=...  ✅ Set?
OPENROUTER_API_KEY=...  ✅ Set?
NEXT_PUBLIC_APP_URL=...  ✅ Set?
```

2. **Database Tables Exist**
```sql
-- Check tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public';

-- Should include:
-- - conversations
-- - messages
-- - chatbots
-- - organizations
-- - team_members
```

3. **RLS Policies Applied**
```sql
-- Check RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';

-- rowsecurity should be 't' (true)
```

---

## Contact Support

If still having issues, provide:
1. Screenshot of /dashboard/chatbots
2. Screenshot of /dashboard/conversations
3. Browser console errors (F12 → Console tab)
4. Supabase SQL query results:
   ```sql
   SELECT COUNT(*) as chatbot_count FROM chatbots;
   SELECT COUNT(*) as conversation_count FROM conversations;
   ```

---

**Document Created:** June 20, 2026  
**Status:** Troubleshooting Guide  
**Next:** Test widget → Send message → Check dashboard

