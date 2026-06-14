# Admin Panel - Quick Guide (اردو میں بھی)

## 🎯 Purchase Requests Admin Panel بن گیا!

### کہاں ہے؟ (Where is it?)
```
Dashboard → Purchase Requests (Sidebar میں)
```

### کون دیکھ سکتا ہے؟ (Who can access?)
✅ Admin users  
✅ Organization owners  
❌ Regular team members  

---

## 📊 Dashboard Overview

### Stats Cards (اوپر):
```
┌─────────────┬─────────────┬─────────────┬─────────────┐
│ Total: 142  │ Pending: 8  │ Premium: 95 │ Enterprise: │
│             │             │             │     47      │
└─────────────┴─────────────┴─────────────┴─────────────┘
```

### Filters (فلٹرز):
```
┌──────────────────────────────────────────────────────┐
│ [Search box...] [All Status ▼] [All Plans ▼]       │
└──────────────────────────────────────────────────────┘
```

### Request Cards (درخواستیں):
```
┌────────────────────────────────────────────────────┐
│ [🏢] Acme Corp    [PREMIUM]  [⏱ Pending Review] ▼ │
│      john@acme.com | Order: ORD-123456             │
└────────────────────────────────────────────────────┘
        ↓ Click to expand
┌────────────────────────────────────────────────────┐
│ [🏢] Acme Corp    [PREMIUM]  [⏱ Pending Review] ▲ │
│      john@acme.com | Order: ORD-123456             │
├────────────────────────────────────────────────────┤
│ Company Details  │  Contact Details                │
│ Size: 51-200     │  Name: John Doe                 │
│ Industry: SaaS   │  Email: john@acme.com           │
│                                                     │
│ Update Status: [Approve] [Complete] [Reject]       │
└────────────────────────────────────────────────────┘
```

---

## 🔍 How to Use (استعمال کیسے کریں)

### 1. View All Requests (سب دیکھیں):
```
Dashboard → Purchase Requests → All requests show
```

### 2. Search (تلاش کریں):
```
Type company name / email / order ID
Results filter automatically
```

### 3. Filter by Status (Status سے فلٹر):
```
Dropdown: 
- All Status
- Pending Review      ← New requests
- Pending Payment     ← Awaiting payment
- Approved            ← Ready to process
- Completed           ← Done ✓
- Cancelled           ← Customer cancelled
- Rejected            ← Not approved
```

### 4. View Details (تفصیل دیکھیں):
```
Click on any card → Expands → Shows:
✓ Company info
✓ Contact person
✓ Billing address
✓ Payment details (Premium)
✓ Requirements (Enterprise)
✓ Timeline
```

### 5. Update Status (Status بدلیں):
```
1. Click card to expand
2. Scroll to bottom
3. Click status button
4. Status updates immediately
```

---

## 📋 Common Admin Tasks

### Task 1: Review New Premium Request
```
1. Go to Purchase Requests
2. Filter: "Pending Review"
3. Click on Premium request
4. Check details
5. Click "Approved"
6. Customer gets notified
```

### Task 2: Handle Enterprise Request
```
1. Go to Purchase Requests
2. Filter: "Pending Review" + "Enterprise"
3. Click to expand
4. Read requirements carefully
5. Note: Expected Users, Chats, Special needs
6. Click "Approved"
7. Contact customer (phone/email shown)
8. After deal: Click "Completed"
```

### Task 3: Find Specific Request
```
1. Use search box
2. Type: company name OR email OR order ID
3. Results show instantly
```

### Task 4: View Only Pending
```
1. Status filter: "Pending Review"
2. Plan filter: "All" or specific
3. See only pending requests
```

---

## 🎨 Status Colors Guide

### Color Coding:
- 🟡 **Yellow** = Pending Review / Pending Payment (Needs action)
- 🟢 **Green** = Approved / Completed (Good!)
- 🔴 **Red** = Rejected (Not approved)
- ⚪ **Gray** = Cancelled (Customer cancelled)

### Icons:
- ⏱️ Clock = Waiting
- ✅ Check = Done
- ❌ X = Rejected
- 🚫 Ban = Cancelled

---

## 💼 Workflow Examples

### Premium Plan Workflow:
```
Customer Submits
    ↓
Pending Review (Admin sees)
    ↓
Admin clicks "Approved"
    ↓
Payment processed
    ↓
Admin clicks "Completed"
    ↓
Done! ✓
```

### Enterprise Workflow:
```
Customer Submits
    ↓
Pending Review (Admin sees)
    ↓
Admin reviews requirements
    ↓
Admin clicks "Approved"
    ↓
Sales team calls customer
    ↓
Deal negotiated
    ↓
Admin clicks "Completed"
    ↓
Done! ✓
```

---

## 📞 Customer Information Available

### What You See for Each Request:

#### Company:
- ✓ Name
- ✓ Size (employees)
- ✓ Industry
- ✓ Website
- ✓ Tax ID

#### Contact:
- ✓ Full Name
- ✓ Job Title
- ✓ Email
- ✓ Phone

#### Address:
- ✓ Street
- ✓ City, State, ZIP
- ✓ Country

#### Payment (Premium):
- ✓ Method
- ✓ Billing Cycle

#### Requirements (Enterprise):
- ✓ Expected Users
- ✓ Expected Chats
- ✓ Special Requirements (detailed notes)

---

## 🚀 Quick Actions

### Daily Routine:
```
Morning:
1. Login to Dashboard
2. Go to Purchase Requests
3. Check "Pending Review" count
4. Review new requests
5. Approve/Reject as needed
```

### Weekly Review:
```
1. Check "Total Requests" stats
2. Review "Completed" for the week
3. Follow up on old "Pending Payment"
4. Contact Enterprise prospects
```

---

## ⚡ Keyboard & Tips

### Tips:
- 💡 Search updates in real-time
- 💡 Multiple filters work together
- 💡 Status updates are instant
- 💡 Click anywhere on card to expand
- 💡 Current status button is disabled
- 💡 Timestamps show "2 hours ago" format

### Best Practices:
1. ✅ Check pending daily
2. ✅ Respond within 24h
3. ✅ Keep status updated
4. ✅ Contact Enterprise quickly
5. ✅ Use search for follow-ups

---

## 🔐 Security

### Who Can Access:
```typescript
if (user.role === 'admin' || user.isOrgOwner) {
  // ✅ Can access
} else {
  // ❌ Redirected to dashboard
}
```

### Data Protection:
- ✅ Only admins see purchase requests
- ✅ Secure API endpoints
- ✅ Database row-level security
- ✅ Auth required for status updates

---

## 📱 Mobile & Desktop

### Desktop:
- Full sidebar
- Wide layout
- All columns visible
- Easy navigation

### Mobile:
- Hamburger menu
- Stacked layout
- Touch-friendly
- Same features

---

## 📞 Support Actions

### For Customer Support:
```
When customer calls about order:
1. Go to Purchase Requests
2. Search: Order ID or Email
3. View status
4. Update if needed
5. Inform customer
```

### For Sales Team:
```
Enterprise leads:
1. Filter: Enterprise + Pending
2. Review requirements
3. Note special needs
4. Call customer (phone shown)
5. Update status after call
```

---

## 🎯 Summary (خلاصہ)

### Access:
📍 **Location:** `/dashboard/purchase-requests`  
🔗 **Link:** Dashboard Sidebar → Purchase Requests  
🛒 **Icon:** Shopping Cart  

### Features:
✅ View all requests  
✅ Search & filter  
✅ See full details  
✅ Update status  
✅ Track timeline  
✅ Real-time stats  

### Status Flow:
```
Pending Review → Approved → Completed ✓
               ↘ Rejected ✗
               ↘ Cancelled
```

---

## 🎉 You're Ready!

**Admin panel is complete and working!**

**Access it now:**
```
1. Login to dashboard
2. Click "Purchase Requests" in sidebar
3. Start managing requests!
```

**کام شروع کریں!** 🚀
