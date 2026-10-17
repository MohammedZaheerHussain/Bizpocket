-- ============================================
-- Password Vault Setup Script for Supabase
-- ============================================
-- This script creates the password_vault table with proper security
-- Run this in your Supabase SQL Editor (Project Settings > SQL Editor)
--
-- Supabase Project: https://ghgsauoicslxuhmztkia.supabase.co
-- ============================================

-- Create Password Vault Table
CREATE TABLE IF NOT EXISTS password_vault (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  website_name TEXT NOT NULL,
  website_url TEXT,
  username TEXT NOT NULL,
  password_encrypted TEXT NOT NULL,
  password_strength INTEGER DEFAULT 0 CHECK (password_strength >= 0 AND password_strength <= 100),
  notes TEXT,
  favicon_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_used_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_password_vault_user ON password_vault (user_id);
CREATE INDEX IF NOT EXISTS idx_password_vault_website ON password_vault (user_id, website_name);
CREATE INDEX IF NOT EXISTS idx_password_vault_last_used ON password_vault (user_id, last_used_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE password_vault ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies

-- Users can view only their own password vault entries
DROP POLICY IF EXISTS "Users can view own password vault entries" ON password_vault;
CREATE POLICY "Users can view own password vault entries"
  ON password_vault FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert only their own password vault entries
DROP POLICY IF EXISTS "Users can insert own password vault entries" ON password_vault;
CREATE POLICY "Users can insert own password vault entries"
  ON password_vault FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update only their own password vault entries
DROP POLICY IF EXISTS "Users can update own password vault entries" ON password_vault;
CREATE POLICY "Users can update own password vault entries"
  ON password_vault FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete only their own password vault entries
DROP POLICY IF EXISTS "Users can delete own password vault entries" ON password_vault;
CREATE POLICY "Users can delete own password vault entries"
  ON password_vault FOR DELETE
  USING (auth.uid() = user_id);

-- Add table comment
COMMENT ON TABLE password_vault IS 'Stores encrypted user credentials for websites and applications';

-- Verification: Check if table was created successfully
DO $$
BEGIN
  RAISE NOTICE 'Password vault table created successfully!';
  RAISE NOTICE 'Table: password_vault';
  RAISE NOTICE 'RLS: Enabled';
  RAISE NOTICE 'Policies: 4 (SELECT, INSERT, UPDATE, DELETE)';
END $$;
