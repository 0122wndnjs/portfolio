-- JKOS 맥 앱 등 기기 토큰 인증
BEGIN;

CREATE TABLE IF NOT EXISTS admin_devices (
  id TEXT PRIMARY KEY,
  rp_id TEXT NOT NULL,
  name TEXT NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL,
  last_used_at TEXT,
  expires_at TEXT NOT NULL,
  revoked_at TEXT
);
CREATE INDEX IF NOT EXISTS admin_devices_rp_idx ON admin_devices(rp_id);

-- 연결 대기 중인 6자리 코드. rp_id 당 하나만 유지한다.
CREATE TABLE IF NOT EXISTS admin_device_pairing (
  rp_id TEXT PRIMARY KEY,
  code_hash TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);

ALTER TABLE admin_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_device_pairing ENABLE ROW LEVEL SECURITY;

COMMIT;
