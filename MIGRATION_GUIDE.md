# Google Sheets → Supabase 데이터 마이그레이션 가이드

기존 Google Sheets의 데이터를 Supabase로 마이그레이션하는 방법입니다.

## 📋 준비물

1. Google Sheets 접근 권한
2. Supabase 프로젝트 (이미 설정 완료)
3. Node.js 설치

## 📥 Step 1: Google Sheets에서 CSV 다운로드

### 사용자 목록 다운로드

1. Google Sheets에서 "사용자목록" 시트 열기
2. **파일** → **다운로드** → **쉼표로 구분된 값(.csv)**
3. 다운로드한 파일 이름을 `users.csv`로 변경
4. 프로젝트 루트 폴더에 복사

### 인증 기록 다운로드

1. Google Sheets에서 "인증기록" 시트 열기
2. **파일** → **다운로드** → **쉼표로 구분된 값(.csv)**
3. 다운로드한 파일 이름을 `checkins.csv`로 변경
4. 프로젝트 루트 폴더에 복사

## 🔧 Step 2: 의존성 설치

```bash
npm install csv-parse
```

## 🚀 Step 3: 마이그레이션 실행

```bash
# .env 파일이 설정되어 있는지 확인
cat .env

# 마이그레이션 스크립트 실행
node scripts/migrate-from-sheets.js
```

## 📊 Step 4: 데이터 확인

### Supabase 대시보드에서 확인

1. [Supabase Dashboard](https://supabase.com) 접속
2. **Table Editor** 열기
3. `users` 테이블 확인
4. `checkins` 테이블 확인

### SQL로 확인

```sql
-- 사용자 수 확인
SELECT COUNT(*) FROM users;

-- 인증 기록 수 확인
SELECT COUNT(*) FROM checkins;

-- 사용자별 인증 횟수
SELECT username, COUNT(*) as count
FROM checkins
GROUP BY username
ORDER BY count DESC;
```

## ⚠️ 주의사항

### CSV 파일 형식

**users.csv 예시:**
```csv
사용자명,비밀번호,등록일시
홍길동,1234,2025-01-01T00:00:00.000Z
김철수,5678,2025-01-02T00:00:00.000Z
```

**checkins.csv 예시:**
```csv
타임스탬프,날짜,사용자명,문제명
2025-01-05T10:30:00.000Z,01/05,홍길동,Two Sum
2025-01-05T11:00:00.000Z,01/05,김철수,Binary Search
```

### 중복 데이터 처리

- 스크립트는 자동으로 중복을 건너뜁니다
- 이미 존재하는 사용자/인증은 "⏭️ 이미 존재" 메시지 표시

### 에러 발생 시

#### "환경변수가 설정되지 않았습니다"

`.env` 파일을 확인하세요:

```bash
# .env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbG...
```

#### "파일을 읽을 수 없습니다"

CSV 파일이 프로젝트 루트에 있는지 확인:

```
bigbrain-tracker/
├── users.csv       ← 여기!
├── checkins.csv    ← 여기!
├── package.json
└── ...
```

#### "사용자를 찾을 수 없음"

1. 먼저 `users.csv`를 마이그레이션했는지 확인
2. CSV의 사용자명이 정확한지 확인

## 🔄 재실행

마이그레이션을 다시 실행해도 안전합니다:
- 중복 데이터는 자동으로 건너뜀
- 새로운 데이터만 추가됨

## 🧹 마이그레이션 후 정리

마이그레이션이 성공적으로 완료되면:

```bash
# CSV 파일 삭제 (옵션)
rm users.csv checkins.csv

# 또는 백업 폴더로 이동
mkdir backup
mv users.csv checkins.csv backup/
```

## ✅ 완료 확인

로컬에서 앱 실행:

```bash
npm run dev
```

브라우저에서 `http://localhost:3000` 접속하여:
1. 기존 사용자로 로그인 테스트
2. 내 기록 조회 테스트
3. 관리자 대시보드(`/admin.html`) 확인

---

## 🆘 문제 해결

### 마이그레이션 중 일부 실패

```bash
# 로그 확인
# 어떤 데이터가 실패했는지 확인 후 CSV 수정
# 다시 실행 (중복은 자동으로 건너뜀)
node scripts/migrate-from-sheets.js
```

### 모든 데이터 삭제하고 다시 시작

```sql
-- Supabase SQL Editor에서 실행
DELETE FROM checkins;
DELETE FROM users;

-- 다시 마이그레이션
```

### 도움이 필요하면

GitHub Issues: https://github.com/yoonichoi/bigbrain-tracker/issues

