BEGIN;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS withholding_amount BIGINT NOT NULL DEFAULT 0;
ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_withholding_amount_check;
ALTER TABLE payments ADD CONSTRAINT payments_withholding_amount_check
  CHECK (withholding_amount >= 0 AND withholding_amount < amount);
COMMIT;
