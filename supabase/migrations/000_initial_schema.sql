-- ============================================
-- 000_initial_schema.sql
-- Complete Base Schema for BizPocket (PocketScan)
-- ============================================

-- 1. Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  currency TEXT DEFAULT 'INR',
  theme TEXT DEFAULT 'dark',
  notification_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Users can view own profile') THEN
    CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Users can insert own profile') THEN
    CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Users can update own profile') THEN
    CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
  END IF;
END $$;

-- 2. Scans Table
CREATE TABLE IF NOT EXISTS public.scans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('business_card', 'receipt', 'invoice', 'linkedin_qr', 'other')),
  image_url TEXT,
  raw_text TEXT,
  structured_json JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_scans_user_id ON public.scans (user_id);
CREATE INDEX IF NOT EXISTS idx_scans_type ON public.scans (type);
CREATE INDEX IF NOT EXISTS idx_scans_created_at ON public.scans (created_at DESC);

ALTER TABLE public.scans ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'scans' AND policyname = 'Users can view own scans') THEN
    CREATE POLICY "Users can view own scans" ON public.scans FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'scans' AND policyname = 'Users can insert own scans') THEN
    CREATE POLICY "Users can insert own scans" ON public.scans FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'scans' AND policyname = 'Users can update own scans') THEN
    CREATE POLICY "Users can update own scans" ON public.scans FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'scans' AND policyname = 'Users can delete own scans') THEN
    CREATE POLICY "Users can delete own scans" ON public.scans FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

-- 3. Invoice Templates Table
CREATE TABLE IF NOT EXISTS public.invoice_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_name TEXT NOT NULL,
  vendor_patterns TEXT[] NOT NULL DEFAULT '{}',
  gstin TEXT,
  field_mappings JSONB,
  sample_extraction JSONB,
  usage_count INTEGER DEFAULT 0,
  accuracy_score DECIMAL(3,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_invoice_templates_patterns ON public.invoice_templates USING GIN (vendor_patterns);
CREATE INDEX IF NOT EXISTS idx_invoice_templates_gstin ON public.invoice_templates (gstin);

ALTER TABLE public.invoice_templates ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'invoice_templates' AND policyname = 'Templates are viewable by all authenticated users') THEN
    CREATE POLICY "Templates are viewable by all authenticated users" ON public.invoice_templates FOR SELECT USING (auth.role() = 'authenticated');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'invoice_templates' AND policyname = 'Templates are manageable by service role') THEN
    CREATE POLICY "Templates are manageable by service role" ON public.invoice_templates FOR ALL USING (auth.role() = 'service_role');
  END IF;
END $$;

-- 4. Extraction Feedback Table
CREATE TABLE IF NOT EXISTS public.extraction_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_id UUID REFERENCES public.scans(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  original_extraction JSONB NOT NULL,
  user_correction JSONB NOT NULL,
  field_corrections TEXT[] DEFAULT '{}',
  extraction_method TEXT,
  scan_type TEXT,
  vendor_matched TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_feedback_user ON public.extraction_feedback (user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_scan ON public.extraction_feedback (scan_id);
CREATE INDEX IF NOT EXISTS idx_feedback_type ON public.extraction_feedback (scan_type);
CREATE INDEX IF NOT EXISTS idx_feedback_vendor ON public.extraction_feedback (vendor_matched);
CREATE INDEX IF NOT EXISTS idx_feedback_fields ON public.extraction_feedback USING GIN (field_corrections);

ALTER TABLE public.extraction_feedback ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'extraction_feedback' AND policyname = 'Users can view own feedback') THEN
    CREATE POLICY "Users can view own feedback" ON public.extraction_feedback FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'extraction_feedback' AND policyname = 'Users can insert own feedback') THEN
    CREATE POLICY "Users can insert own feedback" ON public.extraction_feedback FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- 5. Password Vault Table
CREATE TABLE IF NOT EXISTS public.password_vault (
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

CREATE INDEX IF NOT EXISTS idx_password_vault_user ON public.password_vault (user_id);
CREATE INDEX IF NOT EXISTS idx_password_vault_website ON public.password_vault (user_id, website_name);
CREATE INDEX IF NOT EXISTS idx_password_vault_last_used ON public.password_vault (user_id, last_used_at DESC);

ALTER TABLE public.password_vault ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'password_vault' AND policyname = 'Users can view own password vault entries') THEN
    CREATE POLICY "Users can view own password vault entries" ON public.password_vault FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'password_vault' AND policyname = 'Users can insert own password vault entries') THEN
    CREATE POLICY "Users can insert own password vault entries" ON public.password_vault FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'password_vault' AND policyname = 'Users can update own password vault entries') THEN
    CREATE POLICY "Users can update own password vault entries" ON public.password_vault FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'password_vault' AND policyname = 'Users can delete own password vault entries') THEN
    CREATE POLICY "Users can delete own password vault entries" ON public.password_vault FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

-- 6. Storage Bucket for Scans
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'scans',
  'scans',
  true,
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/jpg']
)
ON CONFLICT (id) DO UPDATE SET public = true;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Allow authenticated users to upload scans') THEN
    CREATE POLICY "Allow authenticated users to upload scans"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'scans');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Allow authenticated users to update scans') THEN
    CREATE POLICY "Allow authenticated users to update scans"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING (bucket_id = 'scans');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Allow public read access to scans') THEN
    CREATE POLICY "Allow public read access to scans"
    ON storage.objects FOR SELECT
    TO public
    USING (bucket_id = 'scans');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Allow users to delete own scans') THEN
    CREATE POLICY "Allow users to delete own scans"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (bucket_id = 'scans' AND (storage.foldername(name))[1] = auth.uid()::text);
  END IF;
END $$;
