# Visual Guide - Purchase Flow System

## 🎯 System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        LANDING PAGE                                 │
│                                                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐            │
│  │   Starter    │  │   Premium    │  │  Enterprise  │            │
│  │    FREE      │  │     $29      │  │    Custom    │            │
│  └──────────────┘  └──────────────┘  └──────────────┘            │
│        │                  │                  │                     │
│        │                  │                  │                     │
│    [Sign Up]    [Purchase Premium]  [Request Enterprise]          │
│        │                  │                  │                     │
└────────┼──────────────────┼──────────────────┼─────────────────────┘
         │                  │                  │
         │                  │                  │
         ↓                  ↓                  ↓
    /signup          /purchase/premium   /purchase/enterprise
```

---

## 📝 Premium Plan Purchase Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    /purchase/premium                            │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────────────┐        ┌──────────────────────────┐
│  STEP 1: Company Info    │        │   Order Summary          │
│  ──────────────────────  │        │  ──────────────────────  │
│  □ Company Name *        │        │  Growth (Premium)        │
│  □ Company Size *        │        │  $29 / month             │
│  □ Industry *            │        │                          │
│  □ Website               │        │  ✓ Unlimited chats       │
│  □ Tax ID                │        │  ✓ Unlimited agents      │
│                          │        │  ✓ AI chatbot            │
│  [Continue →]            │        │  ✓ Visitor tracking      │
└──────────────────────────┘        │  ✓ CRM integrations      │
                                    │  ✓ Priority support      │
           ↓                        │                          │
                                    │  🔒 Secure Payment       │
┌──────────────────────────┐        │  256-bit SSL             │
│  STEP 2: Contact Info    │        └──────────────────────────┘
│  ──────────────────────  │
│  □ Full Name *           │
│  □ Email *               │
│  □ Phone *               │
│  □ Job Title *           │
│                          │
│  Billing Address:        │
│  □ Street Address *      │
│  □ City, State, ZIP *    │
│  □ Country *             │
│                          │
│  [← Back] [Continue →]   │
└──────────────────────────┘

           ↓

┌──────────────────────────┐
│  STEP 3: Payment         │
│  ──────────────────────  │
│  Payment Method:         │
│  ⚬ Credit Card           │
│  ○ Bank Transfer         │
│  ○ PayPal                │
│                          │
│  Billing Cycle:          │
│  ⚬ Monthly - $29/mo      │
│  ○ Yearly - $290/yr      │
│     (Save $58)           │
│                          │
│  ☑ I agree to Terms *    │
│  ☑ I agree to Privacy *  │
│                          │
│  [← Back] [Complete]     │
└──────────────────────────┘

           ↓

┌──────────────────────────────────────────────┐
│          CONFIRMATION PAGE                   │
│                                              │
│          ✓ Thank You!                        │
│                                              │
│     Your Premium subscription                │
│     has been activated                       │
│                                              │
│     Order ID: ORD-1234567890-ABC             │
│                                              │
│     [Go to Dashboard →]                      │
│     [Contact Support]                        │
└──────────────────────────────────────────────┘
```

---

## 🏢 Enterprise Plan Request Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                   /purchase/enterprise                          │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────────────┐        ┌──────────────────────────┐
│  STEP 1: Company Info    │        │   Order Summary          │
│  (Same as Premium)       │        │  ──────────────────────  │
└──────────────────────────┘        │  Enterprise              │
           ↓                        │  Custom Pricing          │
                                    │                          │
┌──────────────────────────┐        │  ✓ Everything in Growth  │
│  STEP 2: Contact Info    │        │  ✓ Unlimited AI          │
│  (Same as Premium)       │        │  ✓ White-label widget    │
└──────────────────────────┘        │  ✓ SLA guarantee         │
           ↓                        │  ✓ Account manager       │
                                    │  ✓ SSO & Security        │
┌──────────────────────────┐        │                          │
│  STEP 3: Requirements    │        │  🔒 Secure Process       │
│  ──────────────────────  │        │  256-bit SSL             │
│  Expected Users:         │        └──────────────────────────┘
│  □ [e.g., 50 agents]     │
│                          │
│  Expected Monthly Chats: │
│  □ [e.g., 10,000]        │
│                          │
│  Special Requirements:   │
│  ╔════════════════════╗  │
│  ║ [Text area for     ║  │
│  ║  custom needs,     ║  │
│  ║  integrations,     ║  │
│  ║  compliance]       ║  │
│  ╚════════════════════╝  │
│                          │
│  [← Back] [Continue →]   │
└──────────────────────────┘

           ↓

┌──────────────────────────┐
│  STEP 4: Review          │
│  ──────────────────────  │
│  Company:                │
│  • Acme Corporation      │
│  • 51-200 employees      │
│  • SaaS Industry         │
│                          │
│  Contact:                │
│  • John Doe - CTO        │
│  • john@acme.com         │
│  • +1 (555) 123-4567     │
│                          │
│  ☑ I agree to Terms *    │
│  ☑ I agree to Privacy *  │
│                          │
│  [← Back] [Submit]       │
└──────────────────────────┘

           ↓

┌──────────────────────────────────────────────┐
│          CONFIRMATION PAGE                   │
│                                              │
│          ✓ Request Submitted!                │
│                                              │
│     Our sales team will contact you          │
│     within 24 hours                          │
│                                              │
│     Order ID: ORD-1234567890-XYZ             │
│                                              │
│     [Contact Support]                        │
└──────────────────────────────────────────────┘
```

---

## 🗄️ Database Flow

```
                    USER SUBMITS FORM
                           ↓
                    API: /api/purchase
                           ↓
                    ┌─────────────┐
                    │  Validate   │
                    │  Request    │
                    └─────────────┘
                           ↓
                    ┌─────────────┐
                    │  Generate   │
                    │  Order ID   │
                    └─────────────┘
                           ↓
      ┌────────────────────┴────────────────────┐
      │                                         │
      ↓                                         ↓
┌─────────────┐                         ┌─────────────┐
│   Insert    │                         │    Send     │
│  Database   │                         │ Notification│
│             │                         │             │
│ purchase_   │                         │  → Support  │
│ requests    │                         │    Team     │
└─────────────┘                         └─────────────┘
      │
      ↓
┌───────────────────────────────────────────────────┐
│  purchase_requests Table                          │
│  ───────────────────────────────────────────────  │
│  • order_id: ORD-1234567890-ABC                   │
│  • plan_type: premium | enterprise                │
│  • status: pending_review                         │
│  • company_name: Acme Corp                        │
│  • email: john@acme.com                           │
│  • phone: +1-555-123-4567                         │
│  • billing_address: [complete address]            │
│  • payment_method: credit_card                    │
│  • created_at: 2026-06-14 10:30:00               │
│  • ... [all other fields]                         │
└───────────────────────────────────────────────────┘
      │
      ↓
┌───────────────────────────────────────────────────┐
│           Status Workflow                         │
│  ───────────────────────────────────────────────  │
│  1. pending_review  ←  Initial status             │
│  2. pending_payment ←  Awaiting payment           │
│  3. approved        ←  Approved by admin          │
│  4. completed       ←  Fully processed            │
│  5. cancelled       ←  Cancelled by customer      │
│  6. rejected        ←  Rejected by admin          │
└───────────────────────────────────────────────────┘
```

---

## 🔐 Security & Compliance

```
┌────────────────────────────────────────────────────┐
│              Security Layers                       │
└────────────────────────────────────────────────────┘

         Frontend                Backend              Database
            │                       │                     │
            │  HTTPS               │                     │
            ├──────────────────────┤                     │
            │                       │                     │
            │  Form Validation     │  API Validation    │
            ├──────────────────────┼─────────────────────┤
            │                       │                     │
            │  Terms Acceptance    │  Data Sanitization │  RLS Policies
            ├──────────────────────┼─────────────────────┤
            │                       │                     │
            │  Privacy Acceptance  │  Error Handling    │  Row Security
            └──────────────────────┴─────────────────────┘

┌────────────────────────────────────────────────────┐
│           Data Protection (GDPR Ready)             │
│  ───────────────────────────────────────────────  │
│  ✓ SSL Encryption (256-bit)                        │
│  ✓ Secure data storage                             │
│  ✓ Terms of Service acceptance                     │
│  ✓ Privacy Policy acceptance                       │
│  ✓ User consent tracking                           │
│  ✓ Data access controls (RLS)                      │
└────────────────────────────────────────────────────┘
```

---

## 📊 Admin View (Future Enhancement)

```
┌───────────────────────────────────────────────────────────────┐
│                    ADMIN DASHBOARD                            │
│                                                               │
│  Purchase Requests                         [New Request: 3]   │
│  ─────────────────────────────────────────────────────────── │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐     │
│  │ Order: ORD-123  │ Acme Corp  │ Premium │ Pending ▼ │     │
│  │ John Doe        │ john@acme.com │ 2h ago │ [View]   │     │
│  ├─────────────────────────────────────────────────────┤     │
│  │ Order: ORD-124  │ Beta Inc   │ Enterprise│ Review ▼│     │
│  │ Jane Smith      │ jane@beta.com │ 5h ago │ [View]   │     │
│  ├─────────────────────────────────────────────────────┤     │
│  │ Order: ORD-125  │ Gamma LLC  │ Premium │ Approved ▼│     │
│  │ Bob Johnson     │ bob@gamma.com │ 1d ago │ [View]   │     │
│  └─────────────────────────────────────────────────────┘     │
│                                                               │
│  Filters: [All] [Pending] [Approved] [Completed]             │
└───────────────────────────────────────────────────────────────┘
```

---

## 🚀 Success Metrics

```
┌────────────────────────────────────────────┐
│        What Gets Measured                  │
└────────────────────────────────────────────┘

📈 Conversion Rate
   Landing Page → Purchase Page → Completion

⏱️ Time to Complete
   Average time from start to submission

📊 Plan Distribution
   Premium vs Enterprise requests

✉️ Follow-up Rate
   Enterprise requests → Sales contact

💰 Revenue Tracking
   Premium subscriptions → MRR/ARR
```

---

**This visual guide shows the complete architecture and user flows of your new professional purchase system!** 🎨

