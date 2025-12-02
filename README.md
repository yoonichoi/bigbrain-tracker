# 🧠 BigBrain Academy - LeetCode Challenge Tracker

매일 리트코드 문제를 풀고 인증하는 스터디 그룹을 위한 **간편한 체크인 시스템**입니다.  
Google Apps Script + Google Sheets를 활용하여 서버 없이 무료로 운영할 수 있습니다.

![Main Screenshot](./screenshots/main.png)
*사용자 인증 화면*

---

## ✨ 주요 기능

### 👤 사용자 기능
- **보안 회원가입**: 등록코드로 스터디 그룹만 가입 가능 🔐
- **간편 등록**: 등록코드 + 이름 + 비밀번호로 즉시 가입
- **일일 인증**: 날짜와 문제 번호를 입력하여 인증
- **실시간 통계**: 총 인증 횟수와 마지막 인증일 확인
- **인증 히스토리**: 최근 10개 인증 기록 조회

![User Stats](./screenshots/user-stats.png)
*사용자 통계 화면*

### 🔐 관리자 대시보드
- **실시간 통계**: 전체 사용자, 전체/오늘 인증, 탈락 위험자 수
- **사용자 관리**: 전체 사용자 목록 및 삭제 기능
- **최근 활동**: 최근 20개 인증 기록 실시간 확인
- **커스텀 리포트**: 원하는 날짜 범위의 리포트 생성
- **구글 시트 연동**: 원본 데이터 바로 확인

![Admin Dashboard](./screenshots/admin-dashboard.png)
*관리자 대시보드*

### 📊 자동 리포트
- **주간 리포트**: 매주 자동 생성 (스케줄 설정 가능)
- **탈락자 추적**: 2일 이상 누락 시 자동 표시
- **커스텀 기간 리포트**: 3일/7일/14일/30일 또는 원하는 기간 설정

![Report Example](./screenshots/report.png)
*주간 리포트 예시*

---

## 🚀 빠른 시작

### 1️⃣ Google Sheets 설정

1. [Google Sheets](https://sheets.google.com) 새 스프레드시트 생성
2. **확장 프로그램** > **Apps Script** 클릭
3. `backend/Code.gs` 내용 전체 복사 & 붙여넣기
4. **⚠️ 중요: 9번째 줄의 등록코드를 변경하세요!**
   ```javascript
   const REGISTER_CODE = 'YOUR_REGISTER_CODE_HERE';  // 원하는 코드로 변경!
   ```
5. **저장** 후 **배포** > **새 배포**
   - 유형: **웹 앱**
   - 액세스 권한: **모든 사용자**
6. 배포 URL 복사 (예: `https://script.google.com/macros/s/ABC.../exec`)

### 2️⃣ 프론트엔드 설정

#### config.js 파일 생성
```bash
# frontend 폴더에서
cd frontend
cp config.example.js config.js
```

#### config.js 수정
```javascript
const CONFIG = {
  // Google Apps Script 배포 URL (1단계에서 복사한 URL)
  SCRIPT_URL: 'https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec',
  
  // 등록코드 (신규 사용자 등록 시 필요)
  // 스터디 그룹 멤버에게만 공유하세요!
  REGISTER_CODE: 'your_registration_code',
  
  // 관리자 비밀번호 (원하는 비밀번호로 변경)
  ADMIN_PASSWORD: 'your_secure_password',
  
  // 구글 시트 URL (1단계의 스프레드시트 URL)
  SHEET_URL: 'https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID/edit'
};
```

> ⚠️ **중요**: 
> - `config.js`는 `.gitignore`에 포함되어 GitHub에 올라가지 않습니다
> - `REGISTER_CODE`는 스터디 그룹 멤버에게만 공유하세요
> - 개인정보가 포함되어 있으므로 절대 GitHub에 푸시하지 마세요!

#### 백엔드 등록코드 설정
Google Apps Script 에디터에서 `backend/Code.gs` 파일 9번째 줄의 `REGISTER_CODE`를 `config.js`와 **동일하게** 설정하세요:
```javascript
// 9번째 줄
const REGISTER_CODE = 'your_registration_code';  // config.js와 동일하게!
```

> 💡 **중요**: 프론트엔드와 백엔드의 등록코드가 일치해야 합니다!

### 3️⃣ 배포

#### Netlify로 배포 (권장 ⭐)

1. **GitHub 저장소에 푸시**
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Netlify 배포**
   - [Netlify](https://netlify.com) 로그인
   - **Add new site** > **Import an existing project**
   - GitHub 저장소 선택

3. **환경 변수 설정** (중요! 🔐)
   
   Netlify Dashboard에서:
   - **Site settings** > **Environment variables** 클릭
   - 다음 4개 변수 추가:
   
   | 변수명 | 값 |
   |--------|-----|
   | `SCRIPT_URL` | Google Apps Script 배포 URL |
   | `REGISTER_CODE` | 등록코드 (예: bigbrain2026) |
   | `ADMIN_PASSWORD` | 관리자 비밀번호 |
   | `SHEET_URL` | 구글 시트 URL |

4. **배포 트리거**
   - **Deploys** 탭 > **Trigger deploy** > **Deploy site** 클릭
   - 빌드가 완료될 때까지 대기 (약 30초)

5. **완료!**
   - `https://your-site-name.netlify.app` 에서 확인
   - 환경 변수는 안전하게 관리되며 GitHub에 노출되지 않음 ✅

> 💡 **왜 Netlify?**: 자동 배포, 빠른 속도, 무료, 민감 정보 관리 쉬움

#### GitHub Pages로 배포 (선택사항)

<details>
<summary>GitHub Pages 사용하려면 클릭</summary>

1. GitHub 저장소 → **Settings** → **Pages**
2. **Source**: `main` branch, `/ (root)` 선택
3. **Save**
4. `https://YOUR_USERNAME.github.io/REPO_NAME/` 에서 확인

⚠️ **주의**: `config.js`를 GitHub에 올려야 하므로 비밀번호가 공개됩니다!

</details>

---

## 📁 프로젝트 구조

```
BigBrainAcademy-LC/
├── backend/
│   └── Code.gs              # Google Apps Script (서버 로직)
├── frontend/
│   ├── index.html           # 사용자 페이지 (개발용)
│   ├── admin.html           # 관리자 페이지 (개발용)
│   ├── config.js            # 실제 설정 (gitignore)
│   └── config.example.js    # 설정 예시 템플릿
├── index.html               # 배포용 (Netlify/GitHub Pages)
├── admin.html               # 배포용 (Netlify/GitHub Pages)
├── config.js                # 배포용 설정 (gitignore)
├── config.example.js        # 설정 예시 템플릿
├── screenshots/             # 스크린샷
├── .gitignore              # Git 제외 파일
├── LICENSE                 # MIT 라이센스
├── CONTRIBUTING.md         # 기여 가이드
└── README.md               # 프로젝트 문서
```

> 📝 **참고**: 루트에 있는 HTML 파일은 배포용입니다. `frontend/`의 파일을 수정한 후 루트로 복사하세요.

---

## 🛠 기술 스택

- **Backend**: Google Apps Script (JavaScript)
- **Database**: Google Sheets
- **Frontend**: Vanilla HTML/CSS/JavaScript
- **Hosting**: Netlify (권장)

### 왜 이 스택?
✅ **완전 무료**: Google Sheets API + Netlify 무료  
✅ **서버 불필요**: Apps Script가 서버 역할  
✅ **쉬운 관리**: 구글 시트에서 데이터 직접 확인  
✅ **빠른 배포**: 5분 안에 시작 가능  
✅ **자동 배포**: Git push만 하면 자동으로 배포

---

## 📊 Google Sheets 데이터 구조

배포 후 자동으로 3개의 시트가 생성됩니다:

### 1. 사용자목록
| 사용자명 | 비밀번호 | 등록일시 |
|---------|---------|---------|
| 홍길동 | '1234 | 2024-12-02T... |

### 2. 인증기록
| 타임스탬프 | 날짜 | 사용자명 | 문제명 |
|-----------|------|---------|--------|
| 2024-12-02T... | '12/02 | 홍길동 | 1. Two Sum |

### 3. 주간리포트 (자동 생성)
| 사용자명 | 인증 횟수 | 인증 날짜들 | 누락 | 상태 |
|---------|----------|-----------|------|------|
| 홍길동 | 6 | 11/25, 11/26... | 1 | ✅ 통과 |

---

## ⚙️ 고급 설정

### 자동 주간 리포트 설정

Apps Script 에디터에서 함수 실행:
```javascript
setupWeeklyTrigger()  // 매주 일요일 밤 11:59 PM (PST)
```

### 커스텀 기간 리포트 생성

Apps Script에서 직접 실행 가능:
```javascript
generate3DayReport()    // 최근 3일
generate7DayReport()    // 최근 7일 (기본)
generate14DayReport()   // 최근 14일
generate30DayReport()   // 최근 30일
```

또는 관리자 대시보드에서 원하는 날짜 범위 선택

---

## 🌍 타임존 독립성

이 시스템은 **타임존 독립적**으로 설계되었습니다:
- 각 사용자가 자신의 로컬 타임존에서 날짜 선택
- 날짜를 **문자열**(MM/DD)로 저장하여 타임존 이슈 방지
- 한국/미국/유럽 어디서든 동일하게 작동

---

## 🔒 보안

### 접근 제어
- **등록코드**: 스터디 그룹 멤버만 가입 가능하도록 등록코드 필수 🔐
- **이중 검증**: 프론트엔드와 백엔드 모두에서 등록코드 검증
- 비밀번호는 Google Sheets에 평문 저장 (개인 스터디용)

### 민감한 정보 관리
- 민감한 설정은 `config.js`로 분리 (`.gitignore`에 포함)
- `config.js`는 절대 GitHub에 푸시하지 마세요!
- 등록코드는 스터디 그룹 멤버에게만 비공개로 공유

```bash
# ✅ GitHub에 올라가는 것
- config.example.js (템플릿)
- Code.gs (등록코드는 플레이스홀더 'YOUR_REGISTER_CODE_HERE')

# ❌ GitHub에 올라가지 않는 것
- config.js (실제 등록코드, 비밀번호, URL 포함)
```

### 안전한 이유
- `Code.gs`는 GitHub에 올라가지만, 등록코드가 `'YOUR_REGISTER_CODE_HERE'`로 되어 있음
- 각 사용자가 Google Apps Script 에디터에서 직접 변경하므로 실제 코드는 노출되지 않음
- `config.js`는 `.gitignore`에 포함되어 절대 GitHub에 올라가지 않음

### 등록코드 관리 팁
- 정기적으로 등록코드 변경 (스터디 시즌마다)
- 외부 공개 금지 (카카오톡, 이메일로만 개별 공유)
- 탈퇴자 발생 시 등록코드 변경 권장

> 💡 **프로덕션 사용 시**: 적절한 암호화 및 인증 시스템 추가 권장

---

## 📝 사용 시나리오

### 스터디 그룹 운영자
1. 시스템 배포 (5분)
2. 등록코드 설정 (프론트엔드 + 백엔드)
3. 멤버들에게 **URL + 등록코드** 비공개로 공유
4. 매주 자동 리포트 확인
5. 탈락 위험자 체크 및 독려

### 스터디 참여자
1. 운영자에게 등록코드 받기
2. 회원가입 (등록코드 + 이름 + 비밀번호)
3. 매일 문제 풀고 인증
4. 본인 통계 확인
5. 꾸준히 참여!

---

## 🤝 기여

버그 리포트나 기능 제안은 Issues에 등록해주세요!

---

## 📄 라이센스

MIT License - 자유롭게 사용하세요!

---

## 📞 문의

프로젝트 관련 문의나 질문은 Issues를 통해 남겨주세요.

---

<div align="center">

**⭐ 이 프로젝트가 도움이 되었다면 Star를 눌러주세요!**

Made with ❤️ for LeetCode enthusiasts

</div>

