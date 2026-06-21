-- =============================================
-- PHASE: Stripe Billing Integration
-- Adds plan tracking to organizations table
-- Run in Supabase Dashboard → SQL Editor
-- =============================================

-- ─────────────────────────────────────────────
-- 1. Extend organizations with billing fields
-- ─────────────────────────────────────────────
ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS plan               TEXT    NOT NULL DEFAULT 'starter'
    CHECK (plan IN ('starter', 'premium', 'enterprise')),
  ADD COLUMN IF NOT EXISTS plan_expires_at    TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;

-- Index for fast plan lookups
CREATE INDEX IF NOT EXISTS idx_orgs_plan    ON public.organizations(plan);
CREATE INDEX IF NOT EXISTS idx_orgs_stripe  ON public.organizations(stripe_customer_id);

-- ─────────────────────────────────────────────
-- 2. Extend purchase_requests if missing columns
-- ─────────────────────────────────────────────
ALTER TABLE public.purchase_requests
  ADD COLUMN IF NOT EXISTS stripe_session_id   TEXT,
  ADD COLUMN IF NOT EXISTS stripe_payment_intent TEXT;

-- ─────────────────────────────────────────────
-- 3. Helper: is_plan_active(org_id)
--    Returns true if org has premium or enterprise
--    and the plan hasn't expired
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.is_plan_active(p_org_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  v_plan        TEXT;
  v_expires_at  TIMESTAMPTZ;
BEGIN
  SELECT plan, plan_expires_at
    INTO v_plan, v_expires_at
    FROM public.organizations
   WHERE id = p_org_id;

  IF v_plan = 'starter' THEN RETURN FALSE; END IF;
  IF v_plan = 'enterprise' THEN RETURN TRUE; END IF;

  -- premium: check expiry
  RETURN (v_expires_at IS NULL OR v_expires_at > NOW());
END;
$$;

COMMENT ON FUNCTION public.is_plan_active IS
  'Returns true if the org has an active paid plan (premium or enterprise).';
