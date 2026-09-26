BEGIN;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS next_action TEXT NOT NULL DEFAULT '';
ALTER TABLE projects ADD COLUMN IF NOT EXISTS waiting_reason TEXT NOT NULL DEFAULT '';
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS parent_id TEXT REFERENCES tasks(id);
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS depends_on_id TEXT REFERENCES tasks(id);
CREATE INDEX IF NOT EXISTS tasks_parent ON tasks(parent_id);
CREATE INDEX IF NOT EXISTS tasks_dependency ON tasks(depends_on_id);
CREATE TABLE IF NOT EXISTS admin_trash (
  id TEXT PRIMARY KEY, entity TEXT NOT NULL CHECK(entity IN ('invoice','payment')),
  title TEXT NOT NULL, payload TEXT NOT NULL, deleted_at TEXT NOT NULL
);
ALTER TABLE admin_trash ENABLE ROW LEVEL SECURITY;
COMMIT;
