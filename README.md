# 🧠 말랑말랑 리트코드 (Big Brain LeetCode Challenge Tracker)

매일 리트코드 문제를 풀고 인증하는 챌린지 트래커입니다. Supabase + Vite + Vercel로 구축된 모던 웹 앱입니다.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## ✨ 주요 기능

- 👤 **사용자 등록**: 등록코드로 간편하게 가입
- ✅ **매일 인증**: 리트코드 문제 풀고 인증
- 📊 **통계 확인**: 개인 인증 기록 및 통계 조회
- 📝 **문제 이름 수정**: 인증 후 문제 이름 변경 가능
- 🔒 **비밀번호 보호**: 내 기록은 비밀번호로 보호
- 👨‍💼 **관리자 대시보드**: 전체 통계 및 사용자 관리

## 🚀 기술 스택

### Frontend
- **Vite** - 빠른 개발 서버 및 빌드 도구
- **Vanilla JS** - 프레임워크 없는 순수 JavaScript
- **CSS3** - 모던하고 반응형 UI

### Backend
- **Supabase** - PostgreSQL 기반 BaaS
- **Row Level Security** - 데이터 보안

### Deployment
- **Vercel** - 자동 배포 및 호스팅
- **Edge Network** - 빠른 전 세계 접근

## 📦 설치 및 실행

### 1️⃣ 클론

```bash
git clone https://github.com/yoonichoi/bigbrain-tracker.git
cd bigbrain-tracker
```

### 2️⃣ 의존성 설치

```bash
npm install
```

### 3️⃣ Supabase 설정

자세한 내용은 [`supabase/SETUP.md`](./supabase/SETUP.md) 참조

1. [Supabase](https://supabase.com)에서 프로젝트 생성
2. SQL Editor에서 `supabase/migrations/001_initial_schema.sql` 실행
3. API Keys 복사

### 4️⃣ 환경변수 설정

```bash
cp .env.example .env
```

`.env` 파일 수정:

```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbG...your-key
VITE_REGISTER_CODE=YOUR_REGISTER_CODE_HERE
```

### 5️⃣ 로컬 개발 서버 실행

```bash
npm run dev
```

`http://localhost:3000` 접속!

## 🌐 Vercel 배포

### 방법 1: GitHub 연동 (권장)

1. GitHub에 푸시
2. [Vercel](https://vercel.com) 로그인
3. **New Project** → GitHub repository 선택
4. **Environment Variables** 추가:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_REGISTER_CODE`
5. **Deploy** 클릭!

### 방법 2: CLI

```bash
npm install -g vercel
vercel login
vercel

# 환경변수 추가
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_ANON_KEY
vercel env add VITE_REGISTER_CODE

# 재배포
vercel --prod
```

## 📊 데이터 마이그레이션

Google Sheets에서 Supabase로 데이터를 마이그레이션하려면:

자세한 내용은 [`MIGRATION_GUIDE.md`](./MIGRATION_GUIDE.md) 참조

```bash
# 1. Google Sheets에서 CSV 다운로드
#    - 사용자목록 → users.csv
#    - 인증기록 → checkins.csv

# 2. CSV 파일을 프로젝트 루트에 복사

# 3. 의존성 설치
npm install csv-parse

# 4. 마이그레이션 실행
node scripts/migrate-from-sheets.js
```

## 📁 프로젝트 구조

```
bigbrain-tracker/
├── index.html              # 메인 페이지
├── admin.html              # 관리자 대시보드
├── package.json
├── vite.config.js
├── vercel.json
├── .env.example
├── src/
│   ├── main.js             # 메인 앱 로직
│   ├── admin.js            # 관리자 로직
│   ├── api.js              # Supabase API 호출
│   ├── supabaseClient.js   # Supabase 클라이언트
│   ├── style.css
│   └── admin-style.css
├── supabase/
│   ├── SETUP.md            # Supabase 설정 가이드
│   └── migrations/
│       └── 001_initial_schema.sql
├── scripts/
│   └── migrate-from-sheets.js
├── backend/                # (구버전 - Google Apps Script)
└── frontend/               # (구버전 - 순수 HTML)
```

## 🎯 사용 방법

### 일반 사용자

1. **등록**: 등록코드를 받아 계정 생성 (이름 + 4자리 비밀번호)
2. **매일 인증**: 리트코드 문제를 풀고 인증
3. **내 기록**: 비밀번호로 내 통계 및 기록 확인
4. **문제 수정**: 잘못 입력한 문제 이름 수정 가능

### 관리자

`/admin.html` 접속:
- 전체 통계 확인 (총 사용자, 총 인증, 오늘 인증)
- 사용자별 인증 현황 조회
- 최근 인증 기록 확인
- 사용자 삭제

## 🔧 개발

### 빌드

```bash
npm run build
```

빌드 결과물은 `dist/` 폴더에 생성됩니다.

### 프리뷰

```bash
npm run preview
```

## 🐛 문제 해결

### CORS 에러

Supabase 프로젝트 설정 확인:
- API → Settings → CORS allowed origins에 도메인 추가

### 환경변수가 undefined

```bash
# .env 파일 확인
cat .env

# Vite 서버 재시작
npm run dev
```

### 데이터가 보이지 않음

Supabase Dashboard → Table Editor에서 데이터 확인

## 📝 라이선스

MIT License - 자유롭게 사용, 수정, 배포 가능합니다.

단, 원저작자 표시를 유지해주세요.

## 👨‍💻 개발자

**Yooni Choi**
- GitHub: [@yoonichoi](https://github.com/yoonichoi)
- Email: [GitHub Profile](https://github.com/yoonichoi)

## 🤝 기여

Issues와 Pull Requests를 환영합니다!

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📸 스크린샷

### 메인 페이지
![Main](screenshots/checkin.png)

### 내 기록
![History](screenshots/mystat.png)

### 관리자 대시보드
![Admin](screenshots/admin-dashboard.png)

---

## 🆚 v1 vs v2

### v1 (Google Apps Script)
- ✅ 간단한 설정
- ❌ 느린 응답 속도
- ❌ 제한적인 기능
- ❌ Apps Script 제약

### v2 (Supabase + Vite + Vercel)
- ✅ 빠른 응답 속도
- ✅ 모던 개발 환경 (`npm run dev`)
- ✅ 강력한 데이터베이스 (PostgreSQL)
- ✅ 자동 배포
- ✅ 실시간 기능 가능
- ✅ 확장 가능한 구조

---

Made with ❤️ by Yooni Choi

**Star ⭐️ this repo if you find it helpful!**
