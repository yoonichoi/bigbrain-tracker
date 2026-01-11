-- ==========================================
-- Exemptions Table (구제권)
-- ==========================================
-- 사용자가 한 달에 한 번 구제권을 사용하여
-- 해당 주의 방출 위기에서 구제받을 수 있음

-- 구제 기록 테이블
CREATE TABLE IF NOT EXISTS exemptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  applied_week_start DATE NOT NULL,
  applied_week_end DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_exemptions_username ON exemptions(username);
CREATE INDEX idx_exemptions_used_at ON exemptions(used_at);
CREATE INDEX idx_exemptions_week ON exemptions(applied_week_start, applied_week_end);

-- RLS 정책 (Row Level Security)
ALTER TABLE exemptions ENABLE ROW LEVEL SECURITY;

-- 모든 읽기 허용 (앱에서 비밀번호 검증)
CREATE POLICY "Allow read access" ON exemptions
  FOR SELECT USING (true);

-- 모든 삽입 허용 (앱에서 비밀번호 검증)
CREATE POLICY "Allow insert access" ON exemptions
  FOR INSERT WITH CHECK (true);

-- 모든 삭제 허용 (관리자용)
CREATE POLICY "Allow delete access" ON exemptions
  FOR DELETE USING (true);
