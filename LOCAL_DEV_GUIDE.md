# 🧪 로컬 개발 환경 설정 가이드

말랑말랑 리트코드를 배포 전에 로컬에서 테스트하는 방법을 안내합니다.

## 📋 목차

1. [개요](#개요)
2. [필요한 준비물](#필요한-준비물)
3. [단계별 설정](#단계별-설정)
4. [테스트 방법](#테스트-방법)
5. [문제 해결](#문제-해결)

---

## 개요

이 프로젝트는 Google Apps Script를 백엔드로 사용하기 때문에, 로컬 개발 환경을 구축하려면 다음 두 가지 방법 중 하나를 선택할 수 있습니다:

1. **방법 1: Google Apps Script + 로컬 프론트엔드** (권장)
   - Google Sheets와 Apps Script는 실제 환경 사용
   - 프론트엔드만 로컬에서 테스트
   - 가장 간단하고 안정적

2. **방법 2: 완전 로컬 환경 (Mock Backend)**
   - 백엔드를 로컬 서버로 대체
   - Google Sheets 없이도 테스트 가능
   - 개발 중 네트워크 지연 없음

---

## 방법 1: Google Apps Script + 로컬 프론트엔드 (권장)

### 1️⃣ 필요한 준비물

- ✅ 웹 브라우저 (Chrome, Firefox 등)
- ✅ 텍스트 에디터 (VS Code 등)
- ✅ 이미 배포된 Google Apps Script URL
- ✅ Python 3 (간단한 로컬 서버 실행용)

### 2️⃣ 설정 단계

#### Step 1: 테스트용 Google Sheet 생성

실제 운영 중인 Google Sheet와 별도로 테스트용 시트를 만드는 것을 권장합니다.

1. Google Sheets에서 새 스프레드시트 생성
2. `확장 프로그램` > `Apps Script` 클릭
3. `backend/Code.gs` 파일 내용을 복사해서 붙여넣기
4. 상단의 등록코드를 테스트용으로 수정:
   ```javascript
   const REGISTER_CODE = 'TEST_CODE_123';
   ```
5. `배포` > `새 배포` 클릭
   - 유형: 웹 앱
   - 액세스 권한: **모든 사용자**
   - 배포 후 **웹 앱 URL** 복사

#### Step 2: 로컬 config.js 파일 생성

프로젝트 루트에 `config.local.js` 파일 생성:

```javascript
// config.local.js - 로컬 개발용 설정
const CONFIG = {
    // 테스트용 Google Apps Script URL
    SCRIPT_URL: 'YOUR_TEST_SCRIPT_URL_HERE',
    
    // 테스트용 등록코드 (위에서 설정한 것과 동일하게)
    REGISTER_CODE: 'TEST_CODE_123'
};
```

#### Step 3: index.html 수정 (임시)

`frontend/index.html`의 18번째 줄을 임시로 수정:

```html
<!-- 원본 -->
<script src="config.js"></script>

<!-- 로컬 테스트용으로 변경 -->
<script src="config.local.js"></script>
```

⚠️ **중요**: 커밋하기 전에 이 부분을 원래대로 되돌려야 합니다!

#### Step 4: 로컬 웹 서버 실행

프로젝트 루트에서 다음 명령어 실행:

```bash
# Python 3가 설치된 경우
cd /Users/yoonichoi/Desktop/bigbrain-tracker
python3 -m http.server 8000
```

또는

```bash
# Node.js가 설치된 경우
npx http-server -p 8000
```

#### Step 5: 브라우저에서 테스트

웹 브라우저를 열고 다음 주소로 접속:

```
http://localhost:8000/frontend/index.html
```

### 3️⃣ 테스트 시나리오

#### ✅ 신규 등록 테스트

1. **등록 탭** 클릭
2. 등록코드: `TEST_CODE_123` 입력
3. 이름: `테스트유저` 입력
4. 비밀번호: `1234` 입력
5. "등록하기" 클릭
6. ✅ 성공 메시지 확인
7. Google Sheets의 "사용자목록" 시트에 추가되었는지 확인

#### ✅ 인증 테스트

1. **인증 탭** 클릭
2. 이름: `테스트유저` 입력
3. 비밀번호: `1234` 입력
4. 문제 이름: `Two Sum` 입력
5. "✅ 인증 완료" 클릭
6. ✅ 성공 메시지 확인
7. Google Sheets의 "인증기록" 시트에 추가되었는지 확인

#### ✅ 내 기록 보기 테스트 (비밀번호 보호)

1. **내 기록 탭** 클릭
2. 이름: `테스트유저` 입력
3. 비밀번호: `1234` 입력
4. "🔍 내 기록 보기" 클릭
5. ✅ 통계와 최근 10개 기록 표시 확인

#### ✅ 비밀번호 오류 테스트

1. **내 기록 탭**에서
2. 이름: `테스트유저` 입력
3. 비밀번호: `9999` (잘못된 비밀번호) 입력
4. "🔍 내 기록 보기" 클릭
5. ❌ "비밀번호가 틀렸습니다!" 에러 메시지 확인

#### ✅ 문제 이름 수정 테스트

1. **내 기록 탭**에서 기록 조회 후
2. 첫 번째 기록의 "수정" 버튼 클릭
3. 문제 이름을 `Binary Search`로 변경
4. "저장" 버튼 클릭
5. ✅ "문제 이름이 수정되었습니다!" 메시지 확인
6. Google Sheets의 "인증기록" 시트에서 실제로 변경되었는지 확인

#### ✅ 중복 인증 방지 테스트

1. **인증 탭**에서
2. 이미 오늘 인증한 사용자로 다시 인증 시도
3. ❌ "이미 오늘 인증하셨습니다!" 에러 메시지 확인

---

## 방법 2: 완전 로컬 환경 (Mock Backend)

실제 Google Sheets 없이 테스트하고 싶다면, 간단한 Mock 서버를 만들 수 있습니다.

### 1️⃣ Mock 서버 생성

프로젝트 루트에 `mock-server.js` 파일 생성:

```javascript
// mock-server.js
const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

// 메모리 저장소
let users = [];
let records = [];

const PORT = 8080;

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  
  // CORS 허용
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  // GET 요청 처리
  if (req.method === 'GET') {
    const action = parsedUrl.query.action;
    
    if (action === 'getUsers') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ users: users.map(u => u.username) }));
      return;
    }
    
    if (action === 'stats') {
      const username = parsedUrl.query.username;
      const password = parsedUrl.query.password;
      
      const user = users.find(u => u.username === username);
      
      if (password && (!user || user.password !== password)) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'unauthorized' }));
        return;
      }
      
      const userRecords = records.filter(r => r.username === username);
      const history = userRecords.slice(-10).reverse().map(r => ({
        date: r.date,
        problem: r.problem,
        timestamp: r.timestamp
      }));
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        count: userRecords.length,
        lastDate: userRecords.length > 0 ? userRecords[userRecords.length - 1].date : '',
        history
      }));
      return;
    }
  }
  
  // POST 요청 처리
  if (req.method === 'POST') {
    let body = '';
    
    req.on('data', chunk => {
      body += chunk.toString();
    });
    
    req.on('end', () => {
      const action = parsedUrl.query.action;
      const data = JSON.parse(body);
      
      if (action === 'register') {
        if (data.registerCode !== 'TEST_CODE_123') {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ status: 'invalid_code' }));
          return;
        }
        
        if (users.find(u => u.username === data.username)) {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ status: 'duplicate' }));
          return;
        }
        
        users.push({
          username: data.username,
          password: data.password
        });
        
        console.log('✅ 사용자 등록:', data.username);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'success' }));
        return;
      }
      
      if (action === 'checkin') {
        const user = users.find(u => u.username === data.username && u.password === data.password);
        
        if (!user) {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ status: 'unauthorized' }));
          return;
        }
        
        const duplicate = records.find(r => r.username === data.username && r.date === data.date);
        if (duplicate) {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ status: 'duplicate' }));
          return;
        }
        
        records.push({
          timestamp: data.timestamp,
          date: data.date,
          username: data.username,
          problem: data.problem
        });
        
        const totalCount = records.filter(r => r.username === data.username).length;
        console.log('✅ 인증 완료:', data.username, data.date);
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'success', totalCount }));
        return;
      }
      
      if (action === 'updateProblem') {
        const user = users.find(u => u.username === data.username && u.password === data.password);
        
        if (!user) {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ status: 'unauthorized' }));
          return;
        }
        
        const record = records.find(r => r.timestamp === data.timestamp && r.username === data.username);
        if (record) {
          record.problem = data.newProblem;
          console.log('✅ 문제 이름 수정:', data.username, data.newProblem);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ status: 'success' }));
        } else {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ status: 'error', message: '기록을 찾을 수 없습니다' }));
        }
        return;
      }
      
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'error', message: '잘못된 요청' }));
    });
    
    return;
  }
  
  res.writeHead(404);
  res.end('Not Found');
});

server.listen(PORT, () => {
  console.log(`🚀 Mock 서버 실행 중: http://localhost:${PORT}`);
  console.log('📝 등록코드: TEST_CODE_123');
  console.log('');
  console.log('프론트엔드는 다른 포트에서 실행하세요:');
  console.log('  python3 -m http.server 8000');
  console.log('  http://localhost:8000/frontend/index.html');
});
```

### 2️⃣ Mock 서버 실행

```bash
# Node.js가 설치되어 있어야 합니다
node mock-server.js
```

### 3️⃣ config.local.js 설정

```javascript
const CONFIG = {
    SCRIPT_URL: 'http://localhost:8080',
    REGISTER_CODE: 'TEST_CODE_123'
};
```

### 4️⃣ 프론트엔드 서버 실행 (다른 터미널)

```bash
cd /Users/yoonichoi/Desktop/bigbrain-tracker
python3 -m http.server 8000
```

### 5️⃣ 테스트

브라우저에서 `http://localhost:8000/frontend/index.html` 접속

---

## 📝 개발 워크플로우

### 일반적인 개발 과정

```bash
# 1. 로컬 서버 시작
python3 -m http.server 8000

# 2. 브라우저에서 테스트
# http://localhost:8000/frontend/index.html

# 3. 코드 수정 (index.html, Code.gs 등)

# 4. 브라우저 새로고침 (Cmd/Ctrl + Shift + R)

# 5. 테스트

# 6. Google Apps Script 수정사항이 있으면:
#    - Apps Script 편집기에서 코드 업데이트
#    - "배포" > "배포 관리" > "새 버전으로 수정"

# 7. 프론트엔드만 수정했으면:
#    - build.sh 실행하여 Netlify에 배포
./build.sh
```

---

## 🐛 문제 해결

### CORS 에러 발생

**증상**: 브라우저 콘솔에 CORS 에러 표시

**해결 방법**:
- Google Apps Script를 사용하는 경우: Apps Script 배포 시 "액세스 권한"을 **모든 사용자**로 설정
- Mock 서버를 사용하는 경우: 위의 `mock-server.js`에 CORS 헤더가 이미 포함되어 있음

### 로컬 서버가 실행되지 않음

**증상**: `python3 -m http.server 8000` 실행 시 오류

**해결 방법**:
```bash
# 다른 포트 사용
python3 -m http.server 8001

# 또는 Node.js 사용
npx http-server -p 8000
```

### Google Sheets 업데이트가 반영되지 않음

**증상**: Apps Script 코드를 수정했는데 변경사항이 적용 안 됨

**해결 방법**:
1. Apps Script 편집기에서 "배포" > "배포 관리" 클릭
2. 현재 배포 옆의 "수정" 아이콘 클릭
3. "새 버전" 선택
4. "배포" 클릭
5. **중요**: 새로운 웹 앱 URL이 변경되지 않았는지 확인
   - 만약 URL이 변경되었다면 `config.local.js`에서 업데이트

### 비밀번호 인증이 작동하지 않음

**증상**: 올바른 비밀번호를 입력했는데 "비밀번호가 틀렸습니다" 에러

**해결 방법**:
1. Google Sheets의 "사용자목록" 시트 확인
2. 비밀번호 열에 작은따옴표(`'1234`)가 붙어있는지 확인
3. 없다면 Apps Script의 `handleRegistration` 함수에서 비밀번호 저장 부분 확인
4. Google Sheets에서 수동으로 `'1234` 형태로 입력 (작은따옴표 포함)

---

## ⚠️ 배포 전 체크리스트

로컬 테스트가 끝나고 실제 배포 전에 다음을 확인하세요:

- [ ] `index.html`의 `<script src="config.js"></script>` 원복 확인
- [ ] `config.js`의 `SCRIPT_URL`이 **운영용** URL인지 확인
- [ ] `config.js`의 `REGISTER_CODE`가 **운영용** 코드인지 확인
- [ ] `config.local.js` 파일이 `.gitignore`에 포함되어 있는지 확인
- [ ] 테스트 데이터를 운영 Google Sheets에 입력하지 않았는지 확인
- [ ] `build.sh` 실행하여 배포

```bash
# 배포
./build.sh
```

---

## 🎉 완료!

이제 로컬에서 안전하게 개발하고 테스트할 수 있습니다!

궁금한 점이 있다면 GitHub Issues에 문의해주세요:
https://github.com/yoonichoi/bigbrain-tracker/issues

---

**Copyright (c) 2025 Yooni Choi**  
Licensed under MIT License

