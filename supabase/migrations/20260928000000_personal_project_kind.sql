-- 개인 프로젝트를 기존 업무 유형 제약에 추가한다. 기존 행은 변경하지 않는다.
BEGIN;

ALTER TABLE projects
  DROP CONSTRAINT IF EXISTS projects_kind_check;

ALTER TABLE projects
  ADD CONSTRAINT projects_kind_check CHECK (kind IN ('외주', '회사', '회사 마케팅', '개인'));

COMMIT;
