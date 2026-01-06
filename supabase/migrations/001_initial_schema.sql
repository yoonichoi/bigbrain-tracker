-- ==========================================
-- 말랑말랑 리트코드 - Supabase Schema
-- ==========================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- Users Table (사용자 목록)
-- ==========================================
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster username lookups
CREATE INDEX idx_users_username ON users(username);

-- ==========================================
-- Checkins Table (인증 기록)
-- ==========================================
CREATE TABLE checkins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  date TEXT NOT NULL,
  problem TEXT DEFAULT '미입력',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Unique constraint: 한 사용자는 하루에 한 번만 인증
  UNIQUE(username, date)
);

-- Indexes for faster queries
CREATE INDEX idx_checkins_username ON checkins(username);
CREATE INDEX idx_checkins_date ON checkins(date);
CREATE INDEX idx_checkins_created_at ON checkins(created_at DESC);

-- ==========================================
-- Row Level Security (RLS) Policies
-- ==========================================

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE checkins ENABLE ROW LEVEL SECURITY;

-- Users table policies
-- 모든 사용자가 users 테이블을 읽을 수 있음 (사용자 목록 조회용)
CREATE POLICY "Anyone can read users"
  ON users FOR SELECT
  USING (true);

-- 새 사용자 등록 허용 (비밀번호 검증은 애플리케이션 레벨에서)
CREATE POLICY "Anyone can insert users"
  ON users FOR INSERT
  WITH CHECK (true);

-- Checkins table policies
-- 모든 사용자가 checkins 테이블을 읽을 수 있음
CREATE POLICY "Anyone can read checkins"
  ON checkins FOR SELECT
  USING (true);

-- 새 인증 기록 추가 허용
CREATE POLICY "Anyone can insert checkins"
  ON checkins FOR INSERT
  WITH CHECK (true);

-- 자기 자신의 인증 기록만 수정 가능 (문제 이름 수정용)
-- 실제로는 username 일치 여부는 애플리케이션에서 비밀번호로 검증
CREATE POLICY "Anyone can update checkins"
  ON checkins FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- ==========================================
-- Functions (도우미 함수)
-- ==========================================

-- 사용자 통계 조회 함수
CREATE OR REPLACE FUNCTION get_user_stats(p_username TEXT)
RETURNS TABLE (
  total_count BIGINT,
  last_date TEXT,
  recent_history JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::BIGINT as total_count,
    (SELECT date FROM checkins WHERE username = p_username ORDER BY created_at DESC LIMIT 1) as last_date,
    (
      SELECT JSONB_AGG(
        JSONB_BUILD_OBJECT(
          'date', date,
          'problem', problem,
          'timestamp', created_at
        )
        ORDER BY created_at DESC
      )
      FROM (
        SELECT date, problem, created_at
        FROM checkins
        WHERE username = p_username
        ORDER BY created_at DESC
        LIMIT 10
      ) recent
    ) as recent_history
  FROM checkins
  WHERE username = p_username;
END;
$$ LANGUAGE plpgsql STABLE;

-- ==========================================
-- Sample Data (테스트용 - 삭제 가능)
-- ==========================================

-- 테스트 사용자 추가
-- INSERT INTO users (username, password) VALUES ('테스트유저', '1234');

-- 테스트 인증 기록 추가
-- INSERT INTO checkins (user_id, username, date, problem) 
-- SELECT id, username, '01/05', 'Two Sum'
-- FROM users WHERE username = '테스트유저';

