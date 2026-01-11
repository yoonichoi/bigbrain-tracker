-- ==========================================
-- Manual Exemption Insert Script
-- ==========================================
-- 사용법: username만 수정하고 실행하면 됩니다

-- 예시: "홍길동"에게 이번 주(1/6~1/12) 구제권 추가
INSERT INTO exemptions (user_id, username, applied_week_start, applied_week_end, used_at)
SELECT 
  u.id,                    -- user_id 자동으로 찾아줌
  '홍길동',                -- 여기만 수정
  '2026-01-06',           -- 구제 적용 주 시작일 (월요일)
  '2026-01-12',           -- 구제 적용 주 종료일 (일요일)
  NOW()                   -- 현재 시간
FROM users u
WHERE u.username = '홍길동'; -- 여기도 수정

-- ==========================================
-- 여러 명 한 번에 추가
-- ==========================================

-- 방법 1: 하나씩 추가
INSERT INTO exemptions (user_id, username, applied_week_start, applied_week_end, used_at)
SELECT id, username, '2026-01-06', '2026-01-12', NOW()
FROM users WHERE username = '홍길동';

INSERT INTO exemptions (user_id, username, applied_week_start, applied_week_end, used_at)
SELECT id, username, '2026-01-06', '2026-01-12', NOW()
FROM users WHERE username = '김철수';

INSERT INTO exemptions (user_id, username, applied_week_start, applied_week_end, used_at)
SELECT id, username, '2026-01-06', '2026-01-12', NOW()
FROM users WHERE username = '이영희';

-- 방법 2: 한 번에 여러 명 (더 깔끔)
INSERT INTO exemptions (user_id, username, applied_week_start, applied_week_end, used_at)
SELECT 
  u.id, 
  u.username, 
  '2026-01-06',  -- 구제 적용 주 시작일
  '2026-01-12',  -- 구제 적용 주 종료일
  NOW()
FROM users u
WHERE u.username IN ('홍길동', '김철수', '이영희');  -- 여기만 수정!

-- ==========================================
-- 확인
-- ==========================================

-- 방금 추가한 구제권 확인
SELECT * FROM exemptions 
WHERE applied_week_start = '2026-01-06' 
  AND applied_week_end = '2026-01-12'
ORDER BY username;
