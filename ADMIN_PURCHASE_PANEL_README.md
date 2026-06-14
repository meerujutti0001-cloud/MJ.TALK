# Admin Purchase Requests Panel - Documentation

## Overview
A complete admin dashboard to view, manage, and track all Premium and Enterprise plan purchase requests.

---

## 🎯 Features Implemented

### 1. **Purchase Requests Admin Page**
- **Location:** `/dashboard/purchase-requests`
- **Access:** Admin users and organization owners only
- **Automatic redirect:** Non-admin users redirected to main dashboard

### 2. **Statistics Dashboard**
Real-time stats showing:
- ✅ Total Requests
- ✅ Pending Review Count
- ✅ Premium Plans Count
- ✅ Enterprise Plans Count

### 3. **Advanced Filtering**
- **Search:** By company name, email, or order ID
- **Status Filter:** All, Pending Review, Pending Payment, Approved, Completed, Cancelled, Rejected
- **Plan Filter:** All, Premium, Enterprise

### 4. **Expandable Request Cards**
Each request card shows:

#### Collapsed View:
- Company icon
- Company name
- Contact email
- Order ID
- Plan badge (Premium/Enterprise)
- Status badge with color coding
- Expand/collapse button

#### Expanded View:
- **Company Details:**
  - Company size
  - Industry
  - Website (clickable link)
  - Tax ID
  
- **Contact Details:**
  - Full name
  - Job title
  - Email
  - Phone number
  
- **Billing Address:**
  - Complete address
  - City, State, ZIP
  - Country
  
- **Payment Information (Premium):**
  - Payment method
  - Billing cycle
  
- **Enterprise Requirements:**
  - Expected users
  - Expected chats
  - Special requirements (detailed text)
  
- **Timeline:**
  - Created date (relative time)
  - Last updated (relative time)
  
- **Status Update Actions:**
  - Quick buttons to change status
  - Visual feedback for current status

### 5. **Status Management**
One-click status updates with color-coded badges:

| Status | Color | Icon | Meaning |
|--------|-------|------|---------|
| Pending Review | Yellow | Clock | Awaiting admin review |
| Pending Payment | Blue | Clock | Awaiting payment |
| Approved | Green | CheckCircle | Approved by admin |
| Completed | Green | CheckCircle | Fully processed |
| Cancelled | Gray | Ban | Cancelled by customer |
| Rejected | Red | XCircle | Rejected by admin |

---

## 📁 Files Created

### 1. Admin Page
```
src/app/dashboard/(main)/purchase-requests/page.tsx
```
- Server component
- Auth check (admin or org owner)
- Fetches all purchase requests
- Passes data to client component

### 2. Purchase Requests List Component
```
src/components/dashboard/purchase-requests-list.tsx
```
- Client component with interactivity
- Filtering and search
- Expandable cards
- Status updates

### 3. API Endpoint
```
src/app/api/purchase/update-status/route.ts
```
- POST endpoint for status updates
- Auth verification
- Admin permission check
- Database update

### 4. Navigation Update
```
src/components/dashboard/dashboard-shell.tsx
```
- Added "Purchase Requests" to sidebar
- Shopping cart icon
- Visible to all users (permissions checked on page load)

---

## 🔐 Security & Permissions

### Access Control:
```typescript
// Check if user is admin or org owner
const { data: profile } = await supabase
  .from("profiles")
  .select("role")
  .eq("id", user.id)
  .single();

const { data: ownedOrg } = await supabase
  .from("organizations")
  .select("id")
  .eq("owner_id", user.id)
  .maybeSingle();

const isAdmin = profile?.role === "admin" || !!ownedOrg;

if (!isAdmin) {
  redirect("/dashboard");
}
```

### Who Can Access:
✅ Users with `role = 'admin'` in profiles table  
✅ Organization owners  
❌ Regular team members  
❌ Non-authenticated users  

---

## 🚀 How to Use

### As Admin:

1. **Access the Panel:**
   ```
   Login → Dashboard → Purchase Requests (in sidebar)
   ```

2. **View All Requests:**
   - See total count in stats cards
   - Scroll through the list
   - Each request shows key info

3. **Search & Filter:**
   - Use search bar for company/email/order ID
   - Filter by status dropdown
   - Filter by plan type

4. **Review Request Details:**
   - Click on any request card to expand
   - View complete information
   - See all customer details

5. **Update Status:**
   - Scroll to bottom of expanded card
   - Click appropriate status button
   - Status updates in real-time

---

## 📊 Admin Workflow Examples

### Premium Plan Request:
```
1. Customer submits → Status: "pending_review"
2. Admin reviews → Update to: "approved"
3. Payment processed → Update to: "completed"
```

### Enterprise Plan Request:
```
1. Customer submits → Status: "pending_review"
2. Admin reviews requirements → Update to: "approved"
3. Sales team contacts customer → Negotiates deal
4. Deal closed → Update to: "completed"

OR

2. Admin reviews → Not suitable → Update to: "rejected"
```

### Cancelled Request:
```
1. Customer changes mind → Admin updates to: "cancelled"
```

---

## 🎨 UI Components

### Stats Cards:
```
┌─────────────────┐  ┌─────────────────┐
│ Total Requests  │  │ Pending Review  │
│      142        │  │       8         │
└─────────────────┘  └─────────────────┘
```

### Request Card (Collapsed):
```
┌────────────────────────────────────────────────────────┐
│ [🏢] Acme Corporation          [PREMIUM]  [⏱ Pending]▼│
│      john@acme.com | Order: ORD-123456                 │
└────────────────────────────────────────────────────────┘
```

### Request Card (Expanded):
```
┌────────────────────────────────────────────────────────┐
│ [🏢] Acme Corporation          [PREMIUM]  [⏱ Pending]▲│
│      john@acme.com | Order: ORD-123456                 │
├────────────────────────────────────────────────────────┤
│                                                         │
│ 🏢 Company Details        👤 Contact Details           │
│ Size: 51-200 employees    Name: John Doe               │
│ Industry: SaaS            Title: CTO                   │
│ Website: acme.com         Email: john@acme.com         │
│ Tax ID: 123-456-789       Phone: +1-555-123-4567      │
│                                                         │
│ 📍 Billing Address        💳 Payment Information       │
│ 123 Main St              Method: Credit Card          │
│ San Francisco, CA 94102   Cycle: Monthly              │
│ United States                                          │
│                                                         │
│ 📅 Timeline                                            │
│ Created: 2 hours ago                                   │
│ Updated: 1 hour ago                                    │
│                                                         │
│ Update Status:                                         │
│ [Pending Review] [Pending Payment] [Approved]         │
│ [Completed] [Cancelled] [Rejected]                     │
└────────────────────────────────────────────────────────┘
```

---

## 🔔 Notifications & Actions

### When Status Changes:
- Real-time update in UI
- Database record updated
- `processed_at` timestamp set (for completed status)

### Future Enhancements (Optional):
- Email notifications to customer on status change
- Email notifications to sales team for new requests
- Slack/Discord webhooks
- Export to CSV
- Bulk status updates
- Admin notes system
- Follow-up reminders

---

## 📱 Responsive Design

### Desktop:
- Full sidebar navigation
- Multi-column layout
- Stats in 4 columns
- Request details in grid

### Mobile:
- Hamburger menu
- Single column layout
- Touch-friendly buttons
- Optimized spacing

---

## 🗄️ Database Queries

### Fetch All Requests:
```typescript
const { data: purchaseRequests } = await supabase
  .from("purchase_requests")
  .select("*")
  .order("created_at", { ascending: false });
```

### Update Status:
```typescript
await supabase
  .from("purchase_requests")
  .update({
    status: newStatus,
    processed_at: status === "completed" ? new Date().toISOString() : null,
  })
  .eq("id", requestId);
```

### Check Admin Access:
```typescript
// Check profile role
const { data: profile } = await supabase
  .from("profiles")
  .select("role")
  .eq("id", user.id)
  .single();

// Check org ownership
const { data: ownedOrg } = await supabase
  .from("organizations")
  .select("id")
  .eq("owner_id", user.id)
  .maybeSingle();
```

---

## 🧪 Testing

### Test Admin Access:

1. **Login as admin/org owner**
2. **Navigate to:** `http://localhost:3000/dashboard/purchase-requests`
3. **Verify:** Page loads with requests list
4. **Check:** Stats show correct counts

### Test Filtering:

1. **Enter search term** in search box
2. **Verify:** List filters in real-time
3. **Change status filter**
4. **Change plan filter**
5. **Verify:** Multiple filters work together

### Test Status Update:

1. **Click on a request** to expand
2. **Scroll to status buttons**
3. **Click different status**
4. **Verify:** Status updates instantly
5. **Refresh page**
6. **Verify:** Status persists

### Test Non-Admin Access:

1. **Login as regular team member**
2. **Try to access:** `/dashboard/purchase-requests`
3. **Verify:** Redirected to `/dashboard`

---

## 💡 Tips & Best Practices

### For Admins:

1. **Check Pending Reviews Daily:**
   - Use status filter: "Pending Review"
   - Respond within 24 hours (especially Enterprise)

2. **Contact Enterprise Clients Quickly:**
   - Review requirements carefully
   - Note any special needs
   - Call within 24 hours

3. **Keep Status Updated:**
   - Move to "Approved" after review
   - Update to "Completed" after setup
   - Use "Rejected" with clear reason

4. **Search is Your Friend:**
   - Find by company name
   - Find by email
   - Find by order ID

5. **Export Data (Future):**
   - Monthly reports
   - Sales tracking
   - Revenue forecasting

---

## 🎯 Summary

### What Admins Can Do:
✅ View all purchase requests in one place  
✅ See statistics at a glance  
✅ Search and filter requests  
✅ View complete customer details  
✅ Update request status  
✅ Track timeline of requests  
✅ Access from dashboard sidebar  

### Access: 
📍 **URL:** `/dashboard/purchase-requests`  
🔐 **Permission:** Admin or Org Owner only  
🎨 **Icon:** Shopping Cart in sidebar  

---

**Your admin panel is now complete and production-ready!** 🎉

Admins can now efficiently manage all purchase requests from a single, professional interface.
