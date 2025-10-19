-- Inventory Security Updates
-- Add proper foreign key constraint for created_by field

-- Add foreign key constraint for created_by to link to user_profiles
ALTER TABLE inventory_transactions
  DROP CONSTRAINT IF EXISTS inventory_transactions_created_by_fkey;

ALTER TABLE inventory_transactions
  ADD CONSTRAINT inventory_transactions_created_by_fkey
  FOREIGN KEY (created_by)
  REFERENCES user_profiles(id)
  ON DELETE SET NULL;

-- Add index for better performance when querying by created_by
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_created_by
  ON inventory_transactions(created_by)
  WHERE created_by IS NOT NULL;

COMMENT ON CONSTRAINT inventory_transactions_created_by_fkey ON inventory_transactions
  IS 'Links inventory transaction to the user who created it for audit trail';
