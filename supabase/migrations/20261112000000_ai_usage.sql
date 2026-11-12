-- 프로젝트별 AI(Claude Code·Codex) 토큰 사용량. 로컬 동기화 스크립트(scripts/sync-ai-usage.mjs)가 채운다.
BEGIN;

ALTER TABLE projects ADD COLUMN IF NOT EXISTS ai_folder TEXT NOT NULL DEFAULT '';

CREATE TABLE IF NOT EXISTS ai_usage (
  id TEXT PRIMARY KEY,               -- tool:session:date:model
  tool TEXT NOT NULL CHECK (tool IN ('claude', 'codex')),
  account TEXT NOT NULL DEFAULT '',
  folder TEXT NOT NULL,
  session_id TEXT NOT NULL,
  model TEXT NOT NULL DEFAULT '',
  usage_date TEXT NOT NULL,          -- Asia/Seoul YYYY-MM-DD
  input_tokens BIGINT NOT NULL DEFAULT 0,
  cache_read_tokens BIGINT NOT NULL DEFAULT 0,
  cache_write_tokens BIGINT NOT NULL DEFAULT 0,
  output_tokens BIGINT NOT NULL DEFAULT 0,
  requests INTEGER NOT NULL DEFAULT 0,
  synced_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS ai_usage_folder_date ON ai_usage (folder, usage_date);

ALTER TABLE ai_usage ENABLE ROW LEVEL SECURITY;

COMMIT;
