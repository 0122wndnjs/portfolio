-- 20260925000000_admin_constraints.sql 적용 전에 SQL Editor에서 실행한다. 읽기 전용.
-- 모든 행의 bad 값이 0이어야 한다. 0이 아닌 항목은 아래 "상세" 쿼리로 확인 후 정리한다.
-- (빈 문자열 날짜 '' 는 마이그레이션이 NULL로 바꾸므로 여기서 세지 않는다.)
SELECT 'projects.status' AS check_name, COUNT(*) AS bad FROM projects WHERE status NOT IN ('준비 중','진행 중','보류','완료','취소')
UNION ALL SELECT 'projects.kind', COUNT(*) FROM projects WHERE kind NOT IN ('외주','회사','회사 마케팅')
UNION ALL SELECT 'projects.contract_amount', COUNT(*) FROM projects WHERE contract_amount < 0
UNION ALL SELECT 'projects.dates', COUNT(*) FROM projects
  WHERE (NULLIF(start_date,'') IS NOT NULL AND start_date !~ '^\d{4}-\d{2}-\d{2}$')
     OR (NULLIF(due_date,'') IS NOT NULL AND due_date !~ '^\d{4}-\d{2}-\d{2}$')
     OR (NULLIF(start_date,'') IS NOT NULL AND NULLIF(due_date,'') IS NOT NULL AND due_date < start_date)
UNION ALL SELECT 'tasks.status', COUNT(*) FROM tasks WHERE status NOT IN ('할 일','진행 중','확인 대기','완료')
UNION ALL SELECT 'tasks.priority', COUNT(*) FROM tasks WHERE priority NOT IN ('낮음','보통','높음')
UNION ALL SELECT 'tasks.archived/position', COUNT(*) FROM tasks WHERE archived NOT IN (0,1) OR position < 0
UNION ALL SELECT 'tasks.due_date', COUNT(*) FROM tasks WHERE NULLIF(due_date,'') IS NOT NULL AND due_date !~ '^\d{4}-\d{2}-\d{2}$'
UNION ALL SELECT 'invoices.amount/due_date', COUNT(*) FROM invoices
  WHERE amount <= 0 OR (NULLIF(due_date,'') IS NOT NULL AND due_date !~ '^\d{4}-\d{2}-\d{2}$')
UNION ALL SELECT 'payments.amount/paid_at', COUNT(*) FROM payments WHERE amount <= 0 OR paid_at !~ '^\d{4}-\d{2}-\d{2}$'
UNION ALL SELECT 'payments.over_invoice', COUNT(*) FROM invoices i
  WHERE i.amount < (SELECT COALESCE(SUM(p.amount),0) FROM payments p WHERE p.invoice_id = i.id)
UNION ALL SELECT 'quotes.status/tax', COUNT(*) FROM quotes WHERE status NOT IN ('초안','발송','수락','거절') OR tax_amount < 0;

-- 상세 예시: SELECT id, name, status, start_date, due_date FROM projects WHERE status NOT IN ('준비 중','진행 중','보류','완료','취소');
