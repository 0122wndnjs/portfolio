-- JKOS 텔레그램 원격 명령 대기열과 원격 승인
BEGIN;

CREATE TABLE IF NOT EXISTS jkos_commands (
  id TEXT PRIMARY KEY,
  text TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued','running','done','failed','expired')),
  result TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS jkos_commands_status_idx ON jkos_commands(status, created_at);

CREATE TABLE IF NOT EXISTS jkos_approvals (
  id TEXT PRIMARY KEY,
  command_id TEXT REFERENCES jkos_commands(id) ON DELETE CASCADE,
  summary TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','expired')),
  created_at TEXT NOT NULL,
  decided_at TEXT,
  consumed_at TEXT
);
CREATE INDEX IF NOT EXISTS jkos_approvals_status_idx ON jkos_approvals(status, consumed_at);

ALTER TABLE jkos_commands ENABLE ROW LEVEL SECURITY;
ALTER TABLE jkos_approvals ENABLE ROW LEVEL SECURITY;

COMMIT;
