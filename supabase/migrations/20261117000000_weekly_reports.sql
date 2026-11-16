-- 프로젝트별 자동 주간 보고서: 프로젝트 설정 컬럼과 보고서 저장 테이블
BEGIN;

ALTER TABLE projects ADD COLUMN IF NOT EXISTS weekly_report BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS report_name TEXT NOT NULL DEFAULT '';
ALTER TABLE projects ADD COLUMN IF NOT EXISTS report_title TEXT NOT NULL DEFAULT '';
ALTER TABLE projects ADD COLUMN IF NOT EXISTS repo_full_name TEXT NOT NULL DEFAULT '';
ALTER TABLE projects ADD COLUMN IF NOT EXISTS repo_branch TEXT NOT NULL DEFAULT 'main';
-- 로드맵 표는 AI가 바꾸지 않고 그대로 넣는다: [{"task":"","period":"","note":""}]
ALTER TABLE projects ADD COLUMN IF NOT EXISTS report_roadmap TEXT NOT NULL DEFAULT '[]';

CREATE TABLE IF NOT EXISTS weekly_reports (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  week_start TEXT NOT NULL,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'generating' CHECK (status IN ('generating','review','confirmed','failed')),
  content TEXT NOT NULL DEFAULT '{}',
  sources TEXT NOT NULL DEFAULT '[]',
  error TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE (project_id, week_start)
);
CREATE INDEX IF NOT EXISTS weekly_reports_week_idx ON weekly_reports(week_start DESC);

ALTER TABLE weekly_reports ENABLE ROW LEVEL SECURITY;

COMMIT;
