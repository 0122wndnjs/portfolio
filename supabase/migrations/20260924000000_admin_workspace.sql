-- Run once in Supabase SQL Editor. No Data API policies are defined.
CREATE TABLE IF NOT EXISTS credentials (
  id TEXT PRIMARY KEY, rp_id TEXT NOT NULL, public_key TEXT NOT NULL, counter BIGINT NOT NULL DEFAULT 0,
  transports TEXT NOT NULL DEFAULT '[]', device_name TEXT NOT NULL DEFAULT '내 기기',
  created_at TEXT NOT NULL, last_used_at TEXT
);
CREATE TABLE IF NOT EXISTS challenges (
  id TEXT PRIMARY KEY, challenge TEXT NOT NULL, kind TEXT NOT NULL, expires_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY, rp_id TEXT NOT NULL, expires_at TEXT NOT NULL, created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS recovery_codes (
  code_hash TEXT PRIMARY KEY, rp_id TEXT NOT NULL, created_at TEXT NOT NULL, used_at TEXT
);
CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY, name TEXT NOT NULL, client TEXT NOT NULL, description TEXT NOT NULL DEFAULT '',
  contact TEXT NOT NULL DEFAULT '', email TEXT NOT NULL DEFAULT '', kind TEXT NOT NULL DEFAULT '외주',
  status TEXT NOT NULL DEFAULT '준비 중', start_date TEXT, due_date TEXT, contract_amount BIGINT,
  memo TEXT NOT NULL DEFAULT '', links TEXT NOT NULL DEFAULT '[]', created_at TEXT NOT NULL, updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY, project_id TEXT NOT NULL REFERENCES projects(id), title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '', status TEXT NOT NULL DEFAULT '할 일', priority TEXT NOT NULL DEFAULT '보통',
  due_date TEXT, position INTEGER NOT NULL DEFAULT 0, checklist TEXT NOT NULL DEFAULT '[]',
  links TEXT NOT NULL DEFAULT '[]', waiting_since TEXT, completed_at TEXT, archived INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL, updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS invoices (
  id TEXT PRIMARY KEY, project_id TEXT NOT NULL REFERENCES projects(id), title TEXT NOT NULL,
  amount BIGINT NOT NULL, due_date TEXT, memo TEXT NOT NULL DEFAULT '', created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS payments (
  id TEXT PRIMARY KEY, invoice_id TEXT NOT NULL REFERENCES invoices(id), amount BIGINT NOT NULL,
  paid_at TEXT NOT NULL, memo TEXT NOT NULL DEFAULT '', created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS quotes (
  id TEXT PRIMARY KEY, project_id TEXT NOT NULL REFERENCES projects(id), number TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL, sender TEXT NOT NULL DEFAULT '', recipient TEXT NOT NULL,
  issue_date TEXT NOT NULL, valid_until TEXT, status TEXT NOT NULL DEFAULT '초안',
  items TEXT NOT NULL, tax_amount BIGINT NOT NULL DEFAULT 0,
  note TEXT NOT NULL DEFAULT '', created_at TEXT NOT NULL, updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS quote_task_links (
  quote_id TEXT NOT NULL REFERENCES quotes(id), item_index INTEGER NOT NULL,
  task_id TEXT NOT NULL UNIQUE REFERENCES tasks(id), PRIMARY KEY (quote_id, item_index)
);
CREATE TABLE IF NOT EXISTS meetings (
  id TEXT PRIMARY KEY, project_id TEXT NOT NULL REFERENCES projects(id), title TEXT NOT NULL,
  meeting_date TEXT NOT NULL, start_time TEXT NOT NULL, attendees TEXT NOT NULL DEFAULT '',
  location TEXT NOT NULL DEFAULT '', agenda TEXT NOT NULL DEFAULT '', decisions TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL, updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS meeting_task_links (
  meeting_id TEXT NOT NULL REFERENCES meetings(id), task_id TEXT NOT NULL UNIQUE REFERENCES tasks(id),
  PRIMARY KEY (meeting_id, task_id)
);
CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS notification_log (
  id TEXT PRIMARY KEY, dedupe_key TEXT NOT NULL UNIQUE, message TEXT NOT NULL,
  sent_at TEXT NOT NULL, result TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS audit_log (
  id TEXT PRIMARY KEY, action TEXT NOT NULL, detail TEXT NOT NULL, created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS rate_limits (
  bucket_key TEXT PRIMARY KEY, attempts INTEGER NOT NULL, window_started TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS tasks_project_status ON tasks(project_id, status, position);
CREATE INDEX IF NOT EXISTS invoices_project ON invoices(project_id);
CREATE INDEX IF NOT EXISTS payments_invoice ON payments(invoice_id);
CREATE INDEX IF NOT EXISTS quotes_project ON quotes(project_id, created_at);
CREATE INDEX IF NOT EXISTS meetings_project_date ON meetings(project_id, meeting_date);

ALTER TABLE credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE recovery_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_task_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_task_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;
