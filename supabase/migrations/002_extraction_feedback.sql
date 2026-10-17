-- Extraction Feedback Table
-- Stores user corrections to improve extraction over time

CREATE TABLE IF NOT EXISTS extraction_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_id UUID REFERENCES scans(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  original_extraction JSONB NOT NULL, -- What AI extracted initially
  user_correction JSONB NOT NULL, -- What user corrected to
  field_corrections TEXT[] DEFAULT '{}', -- Which specific fields were corrected
  extraction_method TEXT, -- 'vision', 'ocr+ai', 'edge-vision'
  scan_type TEXT, -- 'invoice', 'receipt', 'business_card'
  vendor_matched TEXT, -- If a template was matched
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for analytics
CREATE INDEX IF NOT EXISTS idx_feedback_user ON extraction_feedback (user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_scan ON extraction_feedback (scan_id);
CREATE INDEX IF NOT EXISTS idx_feedback_type ON extraction_feedback (scan_type);
CREATE INDEX IF NOT EXISTS idx_feedback_vendor ON extraction_feedback (vendor_matched);
CREATE INDEX IF NOT EXISTS idx_feedback_fields ON extraction_feedback USING GIN (field_corrections);

-- Enable RLS
ALTER TABLE extraction_feedback ENABLE ROW LEVEL SECURITY;

-- Users can only see their own feedback
CREATE POLICY "Users can view own feedback"
  ON extraction_feedback FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own feedback
CREATE POLICY "Users can insert own feedback"
  ON extraction_feedback FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Comment for documentation
COMMENT ON TABLE extraction_feedback IS 'Stores user corrections to extraction results for learning and improvement';
