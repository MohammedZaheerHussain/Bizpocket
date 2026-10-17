-- Password Vault Table
-- Stores encrypted user credentials for websites/apps

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

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_password_vault_user ON password_vault (user_id);
CREATE INDEX IF NOT EXISTS idx_password_vault_website ON password_vault (user_id, website_name);
CREATE INDEX IF NOT EXISTS idx_password_vault_last_used ON password_vault (user_id, last_used_at DESC);

-- Enable RLS
ALTER TABLE password_vault ENABLE ROW LEVEL SECURITY;

-- Users can only view their own password vault entries
CREATE POLICY "Users can view own password vault entries"
  ON password_vault FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own password vault entries
CREATE POLICY "Users can insert own password vault entries"
  ON password_vault FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own password vault entries
CREATE POLICY "Users can update own password vault entries"
  ON password_vault FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own password vault entries
CREATE POLICY "Users can delete own password vault entries"
  ON password_vault FOR DELETE
  USING (auth.uid() = user_id);

-- Comment for documentation
COMMENT ON TABLE password_vault IS 'Stores encrypted user credentials for websites and applications';
