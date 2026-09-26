BEGIN;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS next_check_date TEXT;
ALTER TABLE projects DROP CONSTRAINT IF EXISTS projects_next_check_date_check;
ALTER TABLE projects ADD CONSTRAINT projects_next_check_date_check
  CHECK (next_check_date IS NULL OR next_check_date ~ '^\d{4}-\d{2}-\d{2}$');
CREATE INDEX IF NOT EXISTS projects_next_check_date ON projects(next_check_date) WHERE next_check_date IS NOT NULL;
COMMIT;
