-- ==========================================
-- Weekly Reports Table & Auto-generation
-- ==========================================

-- Weekly Reports 테이블 생성
CREATE TABLE IF NOT EXISTS weekly_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  week_start DATE NOT NULL,
  week_end DATE NOT NULL,
  report_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(week_start, week_end)
);

-- 인덱스 추가
CREATE INDEX idx_weekly_reports_week ON weekly_reports(week_start, week_end);
CREATE INDEX idx_weekly_reports_created ON weekly_reports(created_at DESC);

-- ==========================================
-- Weekly Report 생성 함수
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
  
  -- 리포트 저장 (이미 있으면 업데이트)
  INSERT INTO weekly_reports (week_start, week_end, report_data)
  VALUES (v_week_start, v_week_end, v_report_data)
  ON CONFLICT (week_start, week_end) 
  DO UPDATE SET 
    report_data = EXCLUDED.report_data,
    created_at = NOW();
  
  RAISE NOTICE 'Weekly report generated successfully for % to %', v_week_start, v_week_end;
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- pg_cron으로 매주 자동 실행 설정
-- ==========================================
-- 
-- Supabase Dashboard에서 실행:
-- SQL Editor > New Query
-- 
-- 매주 월요일 3AM EST (= 8AM UTC, EST는 UTC-5)
-- SELECT cron.schedule(
--   'generate-weekly-report',
--   '0 8 * * 1',
--   $$ SELECT generate_weekly_report(); $$
-- );
--
-- 스케줄 확인:
-- SELECT * FROM cron.job;
--
-- 스케줄 삭제 (필요시):
-- SELECT cron.unschedule('generate-weekly-report');
--
-- ==========================================

-- 수동 실행 (테스트용)
-- SELECT generate_weekly_report();

-- 저장된 리포트 확인
-- SELECT * FROM weekly_reports ORDER BY week_start DESC;

