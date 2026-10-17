-- Add 'linkedin_qr' to the allowed scan types
-- This fixes the constraint violation when saving LinkedIn QR scans

-- Drop the existing check constraint
ALTER TABLE scans DROP CONSTRAINT IF EXISTS scans_type_check;

-- Add the new check constraint with linkedin_qr included
ALTER TABLE scans ADD CONSTRAINT scans_type_check 
  CHECK (type IN ('business_card', 'receipt', 'invoice', 'linkedin_qr', 'other'));

-- Comment for documentation
COMMENT ON CONSTRAINT scans_type_check ON scans IS 'Ensures scan type is one of the allowed values';
