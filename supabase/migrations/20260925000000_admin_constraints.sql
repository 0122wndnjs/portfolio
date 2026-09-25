-- 관리자 작업실 데이터 무결성 제약. Supabase SQL Editor에서 한 번 실행한다.
-- 1) 먼저 supabase/checks/20260925_admin_constraints_precheck.sql 결과가 모두 0인지 확인한다.
-- 2) 이 파일 전체를 실행한다. 하나라도 실패하면 전체가 롤백되고 기존 데이터는 바뀌지 않는다.
-- 앱 코드는 이 마이그레이션 적용 전/후 모두 동작한다(컬럼 추가·삭제 없음).
BEGIN;

-- 폼에서 저장된 빈 문자열 날짜를 NULL로 정리 (정렬·연체 계산 오류 방지)
UPDATE projects SET start_date = NULL WHERE start_date = '';
UPDATE projects SET due_date = NULL WHERE due_date = '';
UPDATE tasks SET due_date = NULL WHERE due_date = '';
UPDATE invoices SET due_date = NULL WHERE due_date = '';
UPDATE quotes SET valid_until = NULL WHERE valid_until = '';

-- 재실행해도 되도록 기존 제약을 지우고 다시 만든다.
ALTER TABLE projects
  DROP CONSTRAINT IF EXISTS projects_status_check,
  DROP CONSTRAINT IF EXISTS projects_kind_check,
  DROP CONSTRAINT IF EXISTS projects_contract_amount_check,
  DROP CONSTRAINT IF EXISTS projects_dates_check,
  ADD CONSTRAINT projects_status_check CHECK (status IN ('준비 중','진행 중','보류','완료','취소')),
  ADD CONSTRAINT projects_kind_check CHECK (kind IN ('외주','회사','회사 마케팅')),
  ADD CONSTRAINT projects_contract_amount_check CHECK (contract_amount IS NULL OR contract_amount >= 0),
  ADD CONSTRAINT projects_dates_check CHECK (
    (start_date IS NULL OR start_date ~ '^\d{4}-\d{2}-\d{2}$')
    AND (due_date IS NULL OR due_date ~ '^\d{4}-\d{2}-\d{2}$')
    AND (start_date IS NULL OR due_date IS NULL OR due_date >= start_date)
  );

ALTER TABLE tasks
  DROP CONSTRAINT IF EXISTS tasks_status_check,
  DROP CONSTRAINT IF EXISTS tasks_priority_check,
  DROP CONSTRAINT IF EXISTS tasks_archived_check,
  DROP CONSTRAINT IF EXISTS tasks_position_check,
  DROP CONSTRAINT IF EXISTS tasks_due_date_check,
  ADD CONSTRAINT tasks_status_check CHECK (status IN ('할 일','진행 중','확인 대기','완료')),
  ADD CONSTRAINT tasks_priority_check CHECK (priority IN ('낮음','보통','높음')),
  ADD CONSTRAINT tasks_archived_check CHECK (archived IN (0,1)),
  ADD CONSTRAINT tasks_position_check CHECK (position >= 0),
  ADD CONSTRAINT tasks_due_date_check CHECK (due_date IS NULL OR due_date ~ '^\d{4}-\d{2}-\d{2}$');

ALTER TABLE invoices
  DROP CONSTRAINT IF EXISTS invoices_amount_check,
  DROP CONSTRAINT IF EXISTS invoices_due_date_check,
  ADD CONSTRAINT invoices_amount_check CHECK (amount > 0),
  ADD CONSTRAINT invoices_due_date_check CHECK (due_date IS NULL OR due_date ~ '^\d{4}-\d{2}-\d{2}$');

ALTER TABLE payments
  DROP CONSTRAINT IF EXISTS payments_amount_check,
  DROP CONSTRAINT IF EXISTS payments_paid_at_check,
  ADD CONSTRAINT payments_amount_check CHECK (amount > 0),
  ADD CONSTRAINT payments_paid_at_check CHECK (paid_at ~ '^\d{4}-\d{2}-\d{2}$');

ALTER TABLE quotes
  DROP CONSTRAINT IF EXISTS quotes_status_check,
  DROP CONSTRAINT IF EXISTS quotes_tax_amount_check,
  ADD CONSTRAINT quotes_status_check CHECK (status IN ('초안','발송','수락','거절')),
  ADD CONSTRAINT quotes_tax_amount_check CHECK (tax_amount >= 0);

-- 연결 테이블: 원본(견적서·미팅·작업) 행이 지워지면 연결도 함께 지운다.
-- 프로젝트·작업·청구·입금 본 데이터에는 CASCADE를 걸지 않는다(실수로 연쇄 삭제되지 않도록).
ALTER TABLE quote_task_links
  DROP CONSTRAINT IF EXISTS quote_task_links_quote_id_fkey,
  DROP CONSTRAINT IF EXISTS quote_task_links_task_id_fkey,
  ADD CONSTRAINT quote_task_links_quote_id_fkey FOREIGN KEY (quote_id) REFERENCES quotes(id) ON DELETE CASCADE,
  ADD CONSTRAINT quote_task_links_task_id_fkey FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE;

ALTER TABLE meeting_task_links
  DROP CONSTRAINT IF EXISTS meeting_task_links_meeting_id_fkey,
  DROP CONSTRAINT IF EXISTS meeting_task_links_task_id_fkey,
  ADD CONSTRAINT meeting_task_links_meeting_id_fkey FOREIGN KEY (meeting_id) REFERENCES meetings(id) ON DELETE CASCADE,
  ADD CONSTRAINT meeting_task_links_task_id_fkey FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE;

-- 만료 세션·challenge 정리 및 조회용 인덱스
CREATE INDEX IF NOT EXISTS sessions_expires ON sessions(expires_at);
CREATE INDEX IF NOT EXISTS notification_log_result ON notification_log(result, sent_at);
DELETE FROM sessions WHERE expires_at < to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"');

COMMIT;
