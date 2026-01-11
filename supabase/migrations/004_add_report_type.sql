-- ==========================================
-- Add report_type column to weekly_reports
-- ==========================================

-- report_type 컬럼 추가 ('official' 또는 'custom')
ALTER TABLE weekly_reports 
ADD COLUMN IF NOT EXISTS report_type TEXT DEFAULT 'official';

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_weekly_reports_type ON weekly_reports(report_type);

-- 기존 리포트는 모두 'official'로 설정
UPDATE weekly_reports 
SET report_type = 'official' 
WHERE report_type IS NULL;

-- NOT NULL 제약 조건 추가
ALTER TABLE weekly_reports 
ALTER COLUMN report_type SET NOT NULL;

-- ==========================================
-- generate_weekly_report 함수 수정
-- ==========================================

CREATE OR REPLACE FUNCTION generate_weekly_report()
RETURNS void AS $$
DECLARE
  v_week_start DATE;
  v_week_end DATE;
  v_report_data JSONB;
  v_user RECORD;
  v_user_report JSONB;
  v_users_array JSONB := '[]'::JSONB;
  v_checkins_count INT;
  v_dates TEXT[];
  v_missing INT;
  v_status TEXT;
BEGIN
  -- EST 기준 지난 주의 월요일과 일요일 계산
  -- Cron이 월요일 8AM UTC (= 3AM EST)에 실행되므로, 지난 주 데이터를 집계
  v_week_start := (date_trunc('week', NOW() AT TIME ZONE 'America/New_York' - INTERVAL '7 days'))::DATE;
  v_week_end := v_week_start + INTERVAL '6 days';
  
  RAISE NOTICE 'Generating report for % to %', v_week_start, v_week_end;
  
  -- 각 사용자별로 리포트 생성
  FOR v_user IN 
    SELECT username FROM users ORDER BY username
  LOOP
    -- 해당 주의 인증 기록 가져오기
    -- date는 'MM/DD' 문자열 형식이므로, 2025년으로 파싱해서 비교
    SELECT 
      COUNT(DISTINCT date),
      ARRAY_AGG(DISTINCT date ORDER BY date)
    INTO 
      v_checkins_count,
      v_dates
    FROM checkins
    WHERE username = v_user.username
      AND (
        -- date 필드는 'MM/DD' 형식 (예: 01/01, 12/31)
        -- 연말연초 주차 대응: 12월은 week_start 연도, 1월은 week_end 연도 사용
        CASE 
          WHEN SUBSTRING(date, 1, 2) = '12'
            THEN TO_DATE(EXTRACT(YEAR FROM v_week_start)::TEXT || '/' || date, 'YYYY/MM/DD')
          WHEN SUBSTRING(date, 1, 2) = '01'
            THEN TO_DATE(EXTRACT(YEAR FROM v_week_end)::TEXT || '/' || date, 'YYYY/MM/DD')
          ELSE TO_DATE(EXTRACT(YEAR FROM v_week_start)::TEXT || '/' || date, 'YYYY/MM/DD')
        END
      ) BETWEEN v_week_start AND v_week_end;
    
    -- NULL 처리
    v_checkins_count := COALESCE(v_checkins_count, 0);
    v_dates := COALESCE(v_dates, ARRAY[]::TEXT[]);
    v_missing := 7 - v_checkins_count;
    
    -- 상태 결정
    IF v_missing <= 1 THEN
      v_status := '✅ 통과';
    ELSE
      v_status := '⚠️ ' || v_missing || '일 누락';
    END IF;
    
    -- 사용자 리포트 JSON 생성
    v_user_report := jsonb_build_object(
      'username', v_user.username,
      'count', v_checkins_count,
      'dates', COALESCE(ARRAY_TO_STRING(v_dates, ', '), '인증 없음'),
      'missing', v_missing,
      'status', v_status
    );
    
    -- 배열에 추가
    v_users_array := v_users_array || v_user_report;
  END LOOP;
  
  -- 리포트 데이터 구성
  v_report_data := jsonb_build_object(
    'users', v_users_array,
    'generated_at', NOW()
  );
  
  -- 리포트 저장 (이미 있으면 업데이트, report_type은 'official'로 설정)
  INSERT INTO weekly_reports (week_start, week_end, report_data, report_type)
  VALUES (v_week_start, v_week_end, v_report_data, 'official')
  ON CONFLICT (week_start, week_end) 
  DO UPDATE SET 
    report_data = EXCLUDED.report_data,
    report_type = 'official',
    created_at = NOW();
  
  RAISE NOTICE 'Official weekly report generated successfully for % to %', v_week_start, v_week_end;
END;
$$ LANGUAGE plpgsql;
