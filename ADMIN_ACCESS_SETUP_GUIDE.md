# Admin Access Setup Guide - مکمل گائیڈ

## 🎯 Admin User: meerujutti0.001@gmail.com

**Sirf yeh email admin hai. Koi aur nahi!**

---

## 📋 Step-by-Step Setup (Vercel + Supabase)

### Step 1: Database Migration Run Karein

**Supabase Dashboard par jayen:**

1. **Open Supabase Dashboard:**
   ```
   https://supabase.com/dashboard
   ```

2. **Apna Project select karein**

3. **SQL Editor open karein:**
   - Left sidebar → "SQL Editor"

4. **Migration Run Karein:**
   - Copy paste karein yeh file:
   ```
   d:\CHAT BOT\supabase\migrations\create_admin_system.sql
   ```
   
   - Ya directly yeh SQL run karein ↓

---

## 📝 SQL Code (Copy-Paste karein Supabase SQL Editor mein):

```sql
-- =============================================
-- Admin System for Purchase Requests
-- =============================================

-- Create profiles table for storing admin roles
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Everyone can read their own profile
CREATE POLICY "Users can view own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Users can insert their own profile
CREATE POLICY "Users can insert own profile"
  ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Only admins can update roles
CREATE POLICY "Admins can update profiles"
  ON public.profiles
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Create function to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role)
  VALUES (
    NEW.id,
    NEW.email,
    -- Make meerujutti0.001@gmail.com admin by default
    CASE 
      WHEN NEW.email = 'meerujutti0.001@gmail.com' THEN 'admin'
      ELSE 'user'
    END
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Manually set existing admin user (if already exists)
INSERT INTO public.profiles (id, email, role)
SELECT id, email, 'admin'
FROM auth.users
WHERE email = 'meerujutti0.001@gmail.com'
ON CONFLICT (email) 
DO UPDATE SET role = 'admin';

-- Add comment
COMMENT ON TABLE public.profiles IS 'User profiles with admin role management. Only meerujutti0.001@gmail.com is admin.';
COMMENT ON COLUMN public.profiles.role IS 'User role: admin can access purchase requests, user cannot';

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
```

5. **Click "Run" button**
6. **Wait for "Success" message**

---

### Step 2: Admin Account Create/Login

#### Option A: Agar Account Already Hai

1. **Login karein:**
   ```
   Email: meerujutti0.001@gmail.com
   Password: [Apna existing password]
   ```

2. **Database check karein ke admin ban gaya:**
   - Supabase SQL Editor mein run karein:
   ```sql
   SELECT * FROM profiles WHERE email = 'meerujutti0.001@gmail.com';
   ```
   
3. **Agar role = 'admin' nahi hai toh:**
   ```sql
   UPDATE profiles 
   SET role = 'admin' 
   WHERE email = 'meerujutti0.001@gmail.com';
   ```

#### Option B: Agar Nayi Account Banana Hai

1. **Signup page par jayen:**
   ```
   https://your-app.vercel.app/signup
   ```

2. **Signup karein:**
   ```
   Email: meerujutti0.001@gmail.com
   Password: [Strong password - minimum 8 characters]
   ```
   
   **Recommended Password Format:**
   ```
   Example: Meeru@123!Talk
   ```
   - At least 8 characters
   - Include uppercase
   - Include lowercase
   - Include numbers
   - Include special character

3. **Email Verification:**
   - Gmail inbox check karein
   - Confirmation link click karein
   - Account verify ho jayega

4. **Automatic Admin Ban Jayega:**
   - Trigger automatically `meerujutti0.001@gmail.com` ko admin bana dega

---

### Step 3: Verify Admin Access

1. **Login ho jayen:**
   ```
   https://your-app.vercel.app/login
   ```

2. **Dashboard par jayen:**
   ```
   https://your-app.vercel.app/dashboard
   ```

3. **Sidebar mein dekho:**
   - ✅ "Purchase Requests" link dikhna chahiye (🛒 icon ke saath)

4. **Click karein "Purchase Requests"**
   - ✅ Page load hona chahiye
   - ✅ Stats cards dikhne chahiye
   - ✅ Koi error nahi hona chahiye

---

## 🔐 Password Recovery (Agar Bhool Jayen)

### Forgot Password Flow:

1. **Go to:**
   ```
   https://your-app.vercel.app/forgot-password
   ```

2. **Enter email:**
   ```
   meerujutti0.001@gmail.com
   ```

3. **Check Gmail:**
   - Password reset link ayegi
   - Click karein link par

4. **Set new password:**
   - Strong password enter karein
   - Confirm karein

5. **Login with new password**

---

## 🚨 Troubleshooting

### Problem 1: "Purchase Requests" Link Nahi Dikh Rahi

**Solution:**
```sql
-- Supabase SQL Editor mein run karein:
UPDATE profiles 
SET role = 'admin' 
WHERE email = 'meerujutti0.001@gmail.com';
```

### Problem 2: "Forbidden" Error Aa Raha Hai

**Check karo:**
1. Email correctly spelled hai: `meerujutti0.001@gmail.com`
2. Login ho gaye ho
3. Database mein role = 'admin' hai

**Fix:**
```sql
-- Check current role
SELECT id, email, role FROM profiles WHERE email = 'meerujutti0.001@gmail.com';

-- If not admin, update:
UPDATE profiles SET role = 'admin' WHERE email = 'meerujutti0.001@gmail.com';
```

### Problem 3: Account Exist Nahi Kar Raha

**Solution:**
1. Signup page par jayen
2. Naya account banao
3. Email verify karo
4. Automatic admin ban jayega

### Problem 4: Migration Fail Ho Gaya

**Solution:**
```sql
-- Pehle existing table drop karo (agar hai):
DROP TABLE IF EXISTS profiles CASCADE;

-- Phir migration dobara run karo
-- (Copy paste karo upar wala complete SQL)
```

---

## 📧 Gmail Access for Admin

### Current Admin Email:
```
Email: meerujutti0.001@gmail.com
```

### Gmail Settings (Important):

1. **Two-Factor Authentication:**
   - Gmail par 2FA enable karo (security ke liye)
   - Recovery phone number add karo

2. **App-Specific Password (Agar Email Notifications Add Karna Ho):**
   - Gmail Settings → Security
   - 2-Step Verification → App passwords
   - Generate new app password
   - Use in `.env.local`

3. **Recovery Options:**
   - Recovery email set karo
   - Recovery phone set karo
   - Backup codes download karo

---

## 🔍 Database Queries (Admin Check Karne Ke Liye)

### Check Admin User:
```sql
SELECT id, email, role, created_at 
FROM profiles 
WHERE email = 'meerujutti0.001@gmail.com';
```

### Check All Users:
```sql
SELECT email, role, created_at 
FROM profiles 
ORDER BY created_at DESC;
```

### Make Someone Admin (Agar Zaroorat Ho):
```sql
UPDATE profiles 
SET role = 'admin' 
WHERE email = 'meerujutti0.001@gmail.com';
```

### Remove Admin (Kisi Ko User Banana Ho):
```sql
UPDATE profiles 
SET role = 'user' 
WHERE email = 'some.other@email.com';
```

---

## 🎯 Admin Access Summary

### Who Can Access Purchase Requests:
- ✅ **meerujutti0.001@gmail.com** (ONLY THIS EMAIL)
- ❌ Any other email = NO ACCESS

### How System Checks:
```typescript
// Code checks in 2 ways:
1. Email === "meerujutti0.001@gmail.com" (Direct check)
2. Profile role === "admin" (Database check)

// Both methods work, email check is primary
```

### Access URL:
```
https://your-app.vercel.app/dashboard/purchase-requests
```

---

## 📱 How to Use Admin Panel (Quick Reference)

### Login:
1. Go to your app URL
2. Click "Sign In"
3. Enter: `meerujutti0.001@gmail.com`
4. Enter password
5. Login

### Access Purchase Requests:
1. Dashboard → Sidebar
2. Click "Purchase Requests" (🛒 icon)
3. View all requests

### Manage Requests:
1. Search by company/email
2. Filter by status
3. Click card to expand
4. Update status with buttons

---

## ✅ Deployment Checklist

### Before Going Live:

- [ ] Run migration in Supabase
- [ ] Create admin account (meerujutti0.001@gmail.com)
- [ ] Verify email
- [ ] Test login
- [ ] Test purchase requests access
- [ ] Verify admin panel loads
- [ ] Test status updates
- [ ] Check database entries

### After Deployment:

- [ ] Save password securely (Password Manager)
- [ ] Enable 2FA on Gmail
- [ ] Set recovery options
- [ ] Test full purchase flow
- [ ] Verify admin receives notifications

---

## 🔐 Security Best Practices

### Password Management:
1. Use strong, unique password
2. Store in password manager (LastPass, 1Password, Bitwarden)
3. Never share password
4. Change periodically (every 3-6 months)

### Gmail Security:
1. Enable 2-Factor Authentication
2. Review recent activity regularly
3. Use app-specific passwords for integrations
4. Set up recovery methods

### Admin Access:
1. Only login from trusted devices
2. Always logout after use
3. Don't share admin credentials
4. Monitor database activity

---

## 📞 Emergency Access

### If You Lose Access:

1. **Password Reset:**
   - Use "Forgot Password" link
   - Check Gmail for reset email

2. **Database Direct Fix:**
   - Go to Supabase Dashboard
   - SQL Editor → Run:
   ```sql
   UPDATE profiles SET role = 'admin' 
   WHERE email = 'meerujutti0.001@gmail.com';
   ```

3. **Create New Admin (Last Resort):**
   - Change `ADMIN_EMAIL` in code
   - Redeploy to Vercel
   - Run migration again

---

## 🎉 Complete Setup Summary

### System Configuration:
```
Admin Email: meerujutti0.001@gmail.com
Access Level: Full Admin
Can Access: Purchase Requests Dashboard
Can Do: View, Search, Filter, Update Status
```

### Files Modified:
1. ✅ Database migration created
2. ✅ Purchase requests page updated
3. ✅ API endpoint updated
4. ✅ Email check added

### Security:
- ✅ Only hardcoded email can access
- ✅ Double verification (email + database)
- ✅ RLS policies enabled
- ✅ API permission checks

---

## 🚀 Ready to Go!

**Admin account setup complete!**

### Next Steps:
1. Run migration in Supabase ✅
2. Create/login with meerujutti0.001@gmail.com ✅
3. Access dashboard ✅
4. Manage purchase requests ✅

**Your admin panel is ready! 🎊**

---

**Created:** June 14, 2026  
**Admin:** meerujutti0.001@gmail.com  
**Access:** Purchase Requests Dashboard  
**Security:** Email-based + Database role check
