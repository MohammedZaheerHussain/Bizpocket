-- Invoice Templates Table
-- Stores known vendor invoice formats for improved extraction

CREATE TABLE IF NOT EXISTS invoice_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_name TEXT NOT NULL,
  vendor_patterns TEXT[] NOT NULL DEFAULT '{}', -- Keywords to match (e.g., ['SRI BALAN COMPUTERS', 'GSTIN'])
  gstin TEXT, -- Vendor's GSTIN for matching
  field_mappings JSONB, -- Custom field positions/patterns for this vendor
  sample_extraction JSONB, -- Example of successful extraction
  usage_count INTEGER DEFAULT 0, -- How many times this template was used
  accuracy_score DECIMAL(3,2), -- Average accuracy (0-1)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast pattern matching
CREATE INDEX IF NOT EXISTS idx_invoice_templates_patterns ON invoice_templates USING GIN (vendor_patterns);
CREATE INDEX IF NOT EXISTS idx_invoice_templates_gstin ON invoice_templates (gstin);

-- Enable RLS
ALTER TABLE invoice_templates ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read templates (they're shared)
CREATE POLICY "Templates are viewable by all authenticated users"
  ON invoice_templates FOR SELECT
  USING (auth.role() = 'authenticated');

-- Only allow insert/update via service role (admin)
CREATE POLICY "Templates are manageable by service role"
  ON invoice_templates FOR ALL
  USING (auth.role() = 'service_role');

-- Comment for documentation
COMMENT ON TABLE invoice_templates IS 'Stores known vendor invoice formats for improved extraction accuracy';
