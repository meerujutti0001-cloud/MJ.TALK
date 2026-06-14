-- Create purchase_requests table for storing all purchase and enterprise requests
CREATE TABLE IF NOT EXISTS purchase_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id TEXT NOT NULL UNIQUE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Plan Details
  plan_type TEXT NOT NULL CHECK (plan_type IN ('premium', 'enterprise')),
  status TEXT NOT NULL DEFAULT 'pending_review' CHECK (status IN ('pending_review', 'pending_payment', 'approved', 'completed', 'cancelled', 'rejected')),
  
  -- Company Information
  company_name TEXT NOT NULL,
  company_size TEXT,
  industry TEXT,
  website TEXT,
  tax_id TEXT,
  
  -- Contact Information
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  job_title TEXT,
  
  -- Billing Address
  billing_address TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  country TEXT,
  
  -- Payment Information (for Premium)
  payment_method TEXT,
  billing_cycle TEXT,
  
  -- Additional Requirements (for Enterprise)
  expected_users TEXT,
  expected_chats TEXT,
  required_features JSONB,
  special_requirements TEXT,
  
  -- Notes and Follow-up
  admin_notes TEXT,
  follow_up_date TIMESTAMP WITH TIME ZONE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for better performance
CREATE INDEX idx_purchase_requests_order_id ON purchase_requests(order_id);
CREATE INDEX idx_purchase_requests_user_id ON purchase_requests(user_id);
CREATE INDEX idx_purchase_requests_email ON purchase_requests(email);
CREATE INDEX idx_purchase_requests_status ON purchase_requests(status);
CREATE INDEX idx_purchase_requests_created_at ON purchase_requests(created_at DESC);

-- Add RLS policies
ALTER TABLE purchase_requests ENABLE ROW LEVEL SECURITY;

-- Users can view their own purchase requests
CREATE POLICY "Users can view own purchase requests"
  ON purchase_requests
  FOR SELECT
  USING (auth.uid() = user_id OR email = auth.jwt()->>'email');

-- Anyone can create a purchase request (even non-authenticated users)
CREATE POLICY "Anyone can create purchase requests"
  ON purchase_requests
  FOR INSERT
  WITH CHECK (true);

-- Only admins can update purchase requests
CREATE POLICY "Admins can update purchase requests"
  ON purchase_requests
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_purchase_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER purchase_requests_updated_at
  BEFORE UPDATE ON purchase_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_purchase_requests_updated_at();

-- Add comment
COMMENT ON TABLE purchase_requests IS 'Stores all purchase requests for premium and enterprise plans';
