-- =============================================
-- PHASE 8: Role-Based Access Control (RBAC)
-- Run in Supabase Dashboard → SQL Editor
-- Safe to re-run (IF NOT EXISTS everywhere)
-- =============================================

-- ─────────────────────────────────────────────
-- 1. Ensure profiles table exists (from create_admin_system.sql)
--    and extend it with super_admin role
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email      TEXT NOT NULL UNIQUE,
  role       TEXT DEFAULT 'user'
               CHECK (role IN ('user', 'admin', 'super_admin')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Allow super_admin role value (add to constraint if it already exists)
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_role_check
    CHECK (role IN ('user', 'admin', 'super_admin'));

-- ─────────────────────────────────────────────
-- 2. RLS policies for profiles
-- ─────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can view own profile"   ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update profiles"   ON public.profiles;

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Super admins can update any profile role
CREATE POLICY "Super admins can update profiles"
  ON public.profiles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

-- ─────────────────────────────────────────────
-- 3. Auto-create profile on signup
--    Marks the platform super admin email automatically
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  _super_admin TEXT := current_setting('app.super_admin_email', true);
BEGIN
  INSERT INTO public.profiles (id, email, role)
  VALUES (
    NEW.id,
    NEW.email,
    CASE
      WHEN NEW.email = COALESCE(_super_admin, 'meerujutti0.001@gmail.com') THEN 'super_admin'
      ELSE 'user'
    END
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ─────────────────────────────────────────────
-- 4. Upsert platform super admin
-- ─────────────────────────────────────────────
INSERT INTO public.profiles (id, email, role)
SELECT id, email, 'super_admin'
FROM auth.users
WHERE email = 'meerujutti0.001@gmail.com'
ON CONFLICT (id) DO UPDATE SET role = 'super_admin';

-- ─────────────────────────────────────────────
-- 5. Helper function: get_user_role(user_id, org_id)
--    Returns: 'super_admin' | 'owner' | 'agent' | 'guest'
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_user_role(
  p_user_id UUID,
  p_org_id  UUID DEFAULT NULL
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_email       TEXT;
  v_super_admin TEXT := current_setting('app.super_admin_email', true);
BEGIN
  -- Get user email
  SELECT email INTO v_email FROM auth.users WHERE id = p_user_id;

  -- Super admin check
  IF v_email = COALESCE(v_super_admin, 'meerujutti0.001@gmail.com') THEN
    RETURN 'super_admin';
  END IF;

  -- Also check profiles table
  IF EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = p_user_id AND role = 'super_admin'
  ) THEN
    RETURN 'super_admin';
  END IF;

  IF p_org_id IS NULL THEN
    -- Any org ownership?
    IF EXISTS (SELECT 1 FROM public.organizations WHERE owner_id = p_user_id) THEN
      RETURN 'owner';
    END IF;
    IF EXISTS (
      SELECT 1 FROM public.team_members
      WHERE user_id = p_user_id AND accepted_at IS NOT NULL
    ) THEN
      RETURN 'agent';
    END IF;
    RETURN 'guest';
  END IF;

  -- Check org-specific role
  IF EXISTS (
    SELECT 1 FROM public.organizations
    WHERE id = p_org_id AND owner_id = p_user_id
  ) THEN
    RETURN 'owner';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.team_members
    WHERE org_id = p_org_id
      AND user_id = p_user_id
      AND accepted_at IS NOT NULL
  ) THEN
    RETURN 'agent';
  END IF;

  RETURN 'guest';
END;
$$;

-- ─────────────────────────────────────────────
-- 6. RLS helper: is_org_member(org_id)
--    Returns true if the calling user is owner or agent
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.is_org_member(p_org_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.organizations
    WHERE id = p_org_id AND owner_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM public.team_members
    WHERE org_id = p_org_id
      AND user_id = auth.uid()
      AND accepted_at IS NOT NULL
  );
END;
$$;

-- ─────────────────────────────────────────────
-- 7. Indexes
-- ─────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role  ON public.profiles(role);

COMMENT ON FUNCTION public.get_user_role IS
  'Returns the effective role of a user: super_admin | owner | agent | guest.
   Pass org_id for org-scoped checks, or NULL for platform-wide.';
