// Google Apps Script - 사용자 등록 기능 추가
// 1. 구글 시트 생성
// 2. 확장 프로그램 > Apps Script 클릭
// 3. 이 코드 전체 붙여넣기
// 4. 아래 등록코드를 원하는 값으로 변경 (프론트엔드 config.js와 동일하게!)
// 5. 저장 후 배포

// ⭐⭐⭐ 중요: 등록코드를 변경하세요! (프론트엔드의 config.js와 동일하게!) ⭐⭐⭐
const REGISTER_CODE = 'YOUR_REGISTER_CODE_HERE';

function doGet(e) {
  const action = e.parameter.action;
  
  if (action === 'getUsers') {
    return getRegisteredUsers();
  } else if (action === 'stats') {
    const username = e.parameter.username;
    return getUserStats(username);
  } else if (action === 'getStats') {
    return getAdminStats();
  } else if (action === 'getUsersWithStats') {
    return getUsersWithStats();
  } else if (action === 'getRecentRecords') {
    return getRecentRecords();
  }
  
  return ContentService.createTextOutput("리트코드 챌린지 API 작동 중");
}

function doPost(e) {
  try {
    const action = e.parameter.action;
    
    if (action === 'register') {
      return handleRegistration(e);
    } else if (action === 'checkin') {
      return handleCheckin(e);
    } else if (action === 'deleteUser') {
      return handleDeleteUser(e);
    } else if (action === 'generateCustomReport') {
      return handleGenerateCustomReport(e);
    }
    
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: "잘못된 요청입니다"
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// ========================================
// 사용자 등록
// ========================================

function handleRegistration(e) {
  Logger.log('=== 등록 시작 ===');
  
  try {
    const userSheet = getOrCreateSheet("사용자목록");
    const data = JSON.parse(e.postData.contents);
    
    Logger.log('받은 데이터: ' + JSON.stringify(data));
    
    // 등록코드 검증
    const registerCode = String(data.registerCode || '').trim();
    if (registerCode !== REGISTER_CODE) {
      Logger.log('❌ 등록코드 불일치: "' + registerCode + '"');
      return ContentService.createTextOutput(JSON.stringify({
        status: "invalid_code",
        message: "등록코드가 올바르지 않습니다"
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    // 비밀번호를 문자열로 명시적 변환
    const username = String(data.username).trim();
    const password = String(data.password).trim();
    
    Logger.log('처리된 데이터 - Username: "' + username + '", Password: "' + password + '"');
    
    // 중복 체크
    const lastRow = userSheet.getLastRow();
    Logger.log('현재 행 수: ' + lastRow);
    
    if (lastRow > 1) {
      const existingUsers = userSheet.getRange(2, 1, lastRow - 1, 2).getValues();
      
      for (let i = 0; i < existingUsers.length; i++) {
        if (String(existingUsers[i][0]).trim() === username) {
          Logger.log('❌ 중복 사용자 발견: ' + username);
          return ContentService.createTextOutput(JSON.stringify({
            status: "duplicate",
            message: "이미 등록된 사용자입니다"
          })).setMimeType(ContentService.MimeType.JSON);
        }
      }
    }
    
    // 새 사용자 등록 (비밀번호를 작은따옴표 붙여서 텍스트로 저장)
    Logger.log('새 사용자 등록 중...');
    userSheet.appendRow([
      username,
      "'" + password,  // 작은따옴표로 텍스트 강제
      new Date().toISOString()
    ]);
    
    Logger.log('✅ 등록 완료!');
    
    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      message: "등록 완료!"
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    Logger.log('❌ 에러 발생: ' + error.toString());
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// 등록된 사용자 목록 반환
function getRegisteredUsers() {
  const userSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("사용자목록");
  
  if (!userSheet || userSheet.getLastRow() <= 1) {
    return ContentService.createTextOutput(JSON.stringify({
      users: []
    })).setMimeType(ContentService.MimeType.JSON);
  }
  
  const data = userSheet.getRange(2, 1, userSheet.getLastRow() - 1, 1).getValues();
  const users = data.map(row => row[0]).filter(name => name);
  
  return ContentService.createTextOutput(JSON.stringify({
    users: users
  })).setMimeType(ContentService.MimeType.JSON);
}

// ========================================
// 인증 처리
// ========================================

function handleCheckin(e) {
  const data = JSON.parse(e.postData.contents);
  
  Logger.log('=== 인증 시도 ===');
  Logger.log('Username: ' + data.username);
  Logger.log('Date: ' + data.date);
  Logger.log('입력 타입 - Username: ' + typeof data.username + ', Date: ' + typeof data.date);
  
  // 1. 사용자 인증 (비밀번호 확인)
  const isValid = verifyUser(data.username, data.password);
  Logger.log('비밀번호 인증 결과: ' + isValid);
  
  if (!isValid) {
    Logger.log('❌ 비밀번호 틀림');
    return ContentService.createTextOutput(JSON.stringify({
      status: "unauthorized",
      message: "비밀번호가 틀렸습니다"
    })).setMimeType(ContentService.MimeType.JSON);
  }
  
  Logger.log('✅ 비밀번호 인증 통과');
  
  // 2. 중복 체크 (같은 날짜에 이미 인증했는지)
  const recordSheet = getOrCreateSheet("인증기록");
  const lastRow = recordSheet.getLastRow();
  
  Logger.log('=== 중복 체크 시작 ===');
  Logger.log('인증기록 시트 행 수: ' + lastRow);
  
  if (lastRow > 1) {
    const existingData = recordSheet.getRange(2, 1, lastRow - 1, 4).getValues();
    Logger.log('기존 인증 데이터 개수: ' + existingData.length);
    
    const inputUsername = String(data.username).trim();
    const inputDate = String(data.date).trim();
    
    Logger.log('비교할 입력값 - Username: "' + inputUsername + '", Date: "' + inputDate + '"');
    
    for (let i = 0; i < existingData.length; i++) {
      // 시트의 날짜가 Date 객체일 수 있으므로 처리
      let existingDate;
      if (existingData[i][1] instanceof Date) {
        // Date 객체면 MM/DD 형식으로 변환
        const dateObj = existingData[i][1];
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const day = String(dateObj.getDate()).padStart(2, '0');
        existingDate = month + '/' + day;
      } else {
        // 문자열이면 그대로 사용
        existingDate = String(existingData[i][1]).trim().replace(/^'/, '');
      }
      
      const existingUsername = String(existingData[i][2]).trim();
      
      Logger.log('--- 행 ' + (i+2) + ' 비교 ---');
      Logger.log('시트 Username: "' + existingUsername + '"');
      Logger.log('시트 Date: "' + existingDate + '" (원본 타입: ' + typeof existingData[i][1] + ')');
      Logger.log('입력 Username: "' + inputUsername + '"');
      Logger.log('입력 Date: "' + inputDate + '"');
      
      const usernameMatch = existingUsername === inputUsername;
      const dateMatch = existingDate === inputDate;
      
      Logger.log('Username 일치: ' + usernameMatch);
      Logger.log('Date 일치: ' + dateMatch);
      
      if (usernameMatch && dateMatch) {
        Logger.log('🚨🚨🚨 중복 인증 발견! 🚨🚨🚨');
        return ContentService.createTextOutput(JSON.stringify({
          status: "duplicate",
          message: "이미 오늘 인증하셨습니다!"
        })).setMimeType(ContentService.MimeType.JSON);
      }
    }
  }
  
  Logger.log('✅ 중복 없음 - 새 인증 추가');
  
  // 3. 새 인증 추가 (날짜를 문자열로 강제 저장!)
  recordSheet.appendRow([
    data.timestamp,
    "'" + data.date,  // 작은따옴표로 문자열 강제!
    data.username,
    data.problem
  ]);
  
  Logger.log('인증 기록 저장 완료');
  
  // 4. 총 인증 횟수 계산
  const allRecords = recordSheet.getRange(2, 1, recordSheet.getLastRow() - 1, 4).getValues();
  const totalCount = allRecords.filter(row => String(row[2]).trim() === String(data.username).trim()).length;
  
  Logger.log('총 인증 횟수: ' + totalCount);
  Logger.log('=== 인증 완료 ===');
  
  return ContentService.createTextOutput(JSON.stringify({
    status: "success",
    message: "인증 완료!",
    totalCount: totalCount
  })).setMimeType(ContentService.MimeType.JSON);
}

// 사용자 인증 (비밀번호 확인)
function verifyUser(username, password) {
  const userSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("사용자목록");
  
  if (!userSheet || userSheet.getLastRow() <= 1) {
    Logger.log('사용자 시트가 없거나 비어있음');
    return false;
  }
  
  const data = userSheet.getRange(2, 1, userSheet.getLastRow() - 1, 2).getValues();
  
  Logger.log('=== 사용자 목록 확인 ===');
  Logger.log('총 사용자 수: ' + data.length);
  
  for (let i = 0; i < data.length; i++) {
    const sheetUsername = String(data[i][0]).trim();
    const sheetPassword = String(data[i][1]).trim().replace(/^'/, ''); // 작은따옴표 제거
    const inputUsername = String(username).trim();
    const inputPassword = String(password).trim();
    
    Logger.log('비교 #' + (i+1) + ':');
    Logger.log('  시트 유저: "' + sheetUsername + '" vs 입력: "' + inputUsername + '"');
    Logger.log('  시트 비번: "' + sheetPassword + '" vs 입력: "' + inputPassword + '"');
    Logger.log('  유저 일치: ' + (sheetUsername === inputUsername));
    Logger.log('  비번 일치: ' + (sheetPassword === inputPassword));
    
    if (sheetUsername === inputUsername && sheetPassword === inputPassword) {
      Logger.log('✅ 인증 성공!');
      return true;
    }
  }
  
  Logger.log('❌ 일치하는 사용자 없음');
  return false;
}

// ========================================
// 통계
// ========================================

function getUserStats(username) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("인증기록");
  
  if (!sheet || sheet.getLastRow() <= 1) {
    return ContentService.createTextOutput(JSON.stringify({
      count: 0,
      history: []
    })).setMimeType(ContentService.MimeType.JSON);
  }
  
  const data = sheet.getRange(2, 1, sheet.getLastRow() - 1, 4).getValues();
  const userRecords = data.filter(row => row[2] === username);
  
  // ⭐ 타임스탬프 기준으로 정렬 (오래된 것 -> 최신 것)
  userRecords.sort((a, b) => {
    const timeA = new Date(a[0]).getTime();
    const timeB = new Date(b[0]).getTime();
    return timeA - timeB;
  });
  
  let lastDate = '';
  if (userRecords.length > 0) {
    const lastDateRaw = userRecords[userRecords.length - 1][1];
    // Date 객체면 MM/DD로 변환
    if (lastDateRaw instanceof Date) {
      const month = String(lastDateRaw.getMonth() + 1).padStart(2, '0');
      const day = String(lastDateRaw.getDate()).padStart(2, '0');
      lastDate = month + '/' + day;
    } else {
      lastDate = String(lastDateRaw).replace(/^'/, ''); // 작은따옴표 제거
    }
  }
  
  // 최근 10개 기록 (역순)
  const recentHistory = userRecords
    .slice(-10)  // 최근 10개
    .reverse()   // 최신 순으로 (12/2 -> 11/25)
    .map(row => {
      let dateStr;
      const dateRaw = row[1];
      
      // Date 객체면 MM/DD로 변환
      if (dateRaw instanceof Date) {
        const month = String(dateRaw.getMonth() + 1).padStart(2, '0');
        const day = String(dateRaw.getDate()).padStart(2, '0');
        dateStr = month + '/' + day;
      } else {
        dateStr = String(dateRaw).replace(/^'/, ''); // 작은따옴표 제거
      }
      
      return {
        date: dateStr,
        problem: row[3] || '미입력'
      };
    });
  
  return ContentService.createTextOutput(JSON.stringify({
    count: userRecords.length,
    lastDate: lastDate,
    history: recentHistory
  })).setMimeType(ContentService.MimeType.JSON);
}

// ========================================
// 시트 생성 및 초기화
// ========================================

function getOrCreateSheet(sheetName) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(sheetName);
  
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    
    // 각 시트별 헤더 설정
    if (sheetName === "사용자목록") {
      sheet.appendRow(["사용자명", "비밀번호", "등록일시"]);
    } else if (sheetName === "인증기록") {
      sheet.appendRow(["타임스탬프", "날짜", "사용자명", "문제명"]);
    }
    
    // 헤더 스타일링
    const headerRange = sheet.getRange(1, 1, 1, sheet.getLastColumn());
    headerRange.setBackground("#4285f4");
    headerRange.setFontColor("#ffffff");
    headerRange.setFontWeight("bold");
  }
  
  return sheet;
}

// ========================================
// 주간 리포트 자동 생성
// ========================================

function generateWeeklyReport() {
  return generateReportForDateRange(7); // 기본 7일
}

// 날짜 범위를 지정한 리포트 생성
function generateReportForDateRange(daysBack) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const dataSheet = ss.getSheetByName("인증기록");
  const userSheet = ss.getSheetByName("사용자목록");
  const reportSheet = ss.getSheetByName("주간리포트") || ss.insertSheet("주간리포트");
  
  if (!dataSheet || dataSheet.getLastRow() <= 1) {
    Logger.log("인증 데이터가 없습니다.");
    return;
  }
  
  if (!userSheet || userSheet.getLastRow() <= 1) {
    Logger.log("등록된 사용자가 없습니다.");
    return;
  }
  
  // 리포트 시트 초기화
  reportSheet.clear();
  reportSheet.appendRow(["사용자명", "인증 횟수", "인증 날짜들", "누락", "상태", `(최근 ${daysBack}일)`]);
  
  // 등록된 사용자 목록
  const registeredUsers = userSheet.getRange(2, 1, userSheet.getLastRow() - 1, 1)
    .getValues()
    .map(row => row[0]);
  
  // 지정된 일수만큼 과거 데이터
  const today = new Date();
  const startDate = new Date(today.getTime() - daysBack * 24 * 60 * 60 * 1000);
  
  const data = dataSheet.getRange(2, 1, dataSheet.getLastRow() - 1, 4).getValues();
  const userStats = {};
  
  // 등록된 사용자만 초기화
  registeredUsers.forEach(user => {
    userStats[user] = new Set();
  });
  
  // 데이터 집계 (등록된 사용자만, 지정된 기간만)
  for (let i = 0; i < data.length; i++) {
    const timestamp = new Date(data[i][0]);
    const username = data[i][2];
    
    // 날짜 처리
    let dateStr;
    const dateRaw = data[i][1];
    if (dateRaw instanceof Date) {
      const month = String(dateRaw.getMonth() + 1).padStart(2, '0');
      const day = String(dateRaw.getDate()).padStart(2, '0');
      dateStr = month + '/' + day;
    } else {
      dateStr = String(dateRaw).replace(/^'/, '');
    }
    
    // 등록된 사용자이고 지정된 기간 데이터인 경우만
    if (registeredUsers.includes(username) && timestamp >= startDate) {
      userStats[username].add(dateStr);
    }
  }
  
  // 리포트 작성
  const reportData = [];
  for (const username in userStats) {
    const dates = Array.from(userStats[username]).sort();
    const count = dates.length;
    const missing = daysBack - count;
    const status = missing <= 1 ? "✅ 통과" : `⚠️ ${missing}일 누락`;
    
    reportSheet.appendRow([
      username,
      count,
      dates.join(", ") || "인증 없음",
      missing,
      status
    ]);
    
    reportData.push({username, count, missing, status});
  }
  
  // 스타일링
  const headerRange = reportSheet.getRange(1, 1, 1, 6);
  headerRange.setBackground("#4285f4");
  headerRange.setFontColor("#ffffff");
  headerRange.setFontWeight("bold");
  headerRange.setHorizontalAlignment("center");
  
  // 통과/경고 색상
  if (reportData.length > 0) {
    for (let i = 0; i < reportData.length; i++) {
      const rowRange = reportSheet.getRange(i + 2, 1, 1, 6);
      if (reportData[i].missing <= 1) {
        rowRange.setBackground("#d9ead3"); // 연한 초록
      } else {
        rowRange.setBackground("#f4cccc"); // 연한 빨강
      }
    }
  }
  
  // 열 너비 자동 조정
  reportSheet.autoResizeColumns(1, 6);
  
  Logger.log(`${daysBack}일 리포트 생성 완료! (${reportData.length}명)`);
  return reportData;
}

// ========================================
// 수동 리포트 생성 함수들 (직접 실행용)
// ========================================

// 최근 3일 리포트
function generate3DayReport() {
  return generateReportForDateRange(3);
}

// 최근 5일 리포트 (주중만)
function generate5DayReport() {
  return generateReportForDateRange(5);
}

// 최근 7일 리포트 (기본 주간)
function generate7DayReport() {
  return generateReportForDateRange(7);
}

// 최근 14일 리포트
function generate14DayReport() {
  return generateReportForDateRange(14);
}

// 최근 30일 리포트 (월간)
function generate30DayReport() {
  return generateReportForDateRange(30);
}

// 특정 날짜 범위 리포트 생성
function generateReportBetweenDates(startDate, endDate) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const dataSheet = ss.getSheetByName("인증기록");
  const userSheet = ss.getSheetByName("사용자목록");
  const reportSheet = ss.getSheetByName("주간리포트") || ss.insertSheet("주간리포트");
  
  if (!dataSheet || dataSheet.getLastRow() <= 1) {
    Logger.log("인증 데이터가 없습니다.");
    return [];
  }
  
  if (!userSheet || userSheet.getLastRow() <= 1) {
    Logger.log("등록된 사용자가 없습니다.");
    return [];
  }
  
  // 종료일을 하루의 끝으로 설정 (23:59:59)
  endDate.setHours(23, 59, 59, 999);
  
  // 일수 계산
  const daysDiff = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
  
  // 리포트 시트 초기화
  reportSheet.clear();
  const dateRange = `${startDate.toLocaleDateString('ko-KR')} ~ ${endDate.toLocaleDateString('ko-KR')}`;
  reportSheet.appendRow(["사용자명", "인증 횟수", "인증 날짜들", "누락", "상태", dateRange]);
  
  // 등록된 사용자 목록
  const registeredUsers = userSheet.getRange(2, 1, userSheet.getLastRow() - 1, 1)
    .getValues()
    .map(row => row[0]);
  
  const data = dataSheet.getRange(2, 1, dataSheet.getLastRow() - 1, 4).getValues();
  const userStats = {};
  
  // 등록된 사용자만 초기화
  registeredUsers.forEach(user => {
    userStats[user] = new Set();
  });
  
  // 데이터 집계
  for (let i = 0; i < data.length; i++) {
    const timestamp = new Date(data[i][0]);
    const username = data[i][2];
    
    // 날짜 처리
    let dateStr;
    const dateRaw = data[i][1];
    if (dateRaw instanceof Date) {
      const month = String(dateRaw.getMonth() + 1).padStart(2, '0');
      const day = String(dateRaw.getDate()).padStart(2, '0');
      dateStr = month + '/' + day;
    } else {
      dateStr = String(dateRaw).replace(/^'/, '');
    }
    
    // 지정된 날짜 범위 내의 데이터만
    if (registeredUsers.includes(username) && timestamp >= startDate && timestamp <= endDate) {
      userStats[username].add(dateStr);
    }
  }
  
  // 리포트 작성
  const reportData = [];
  for (const username in userStats) {
    const dates = Array.from(userStats[username]).sort();
    const count = dates.length;
    const missing = daysDiff - count;
    const status = missing <= 1 ? "✅ 통과" : `⚠️ ${missing}일 누락`;
    
    reportSheet.appendRow([
      username,
      count,
      dates.join(", ") || "인증 없음",
      missing,
      status
    ]);
    
    reportData.push({username, count, missing, status});
  }
  
  // 스타일링
  const headerRange = reportSheet.getRange(1, 1, 1, 6);
  headerRange.setBackground("#4285f4");
  headerRange.setFontColor("#ffffff");
  headerRange.setFontWeight("bold");
  headerRange.setHorizontalAlignment("center");
  
  // 통과/경고 색상
  if (reportData.length > 0) {
    for (let i = 0; i < reportData.length; i++) {
      const rowRange = reportSheet.getRange(i + 2, 1, 1, 6);
      if (reportData[i].missing <= 1) {
        rowRange.setBackground("#d9ead3");
      } else {
        rowRange.setBackground("#f4cccc");
      }
    }
  }
  
  reportSheet.autoResizeColumns(1, 6);
  
  Logger.log(`커스텀 리포트 생성 완료! (${dateRange}, ${reportData.length}명)`);
  return reportData;
}

// 커스텀 리포트 생성 (관리자 대시보드용 - 별도 시트 사용)
function generateReportBetweenDatesForCustom(startDate, endDate) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const dataSheet = ss.getSheetByName("인증기록");
  const userSheet = ss.getSheetByName("사용자목록");
  
  // 커스텀리포트 시트 생성 또는 가져오기
  let reportSheet = ss.getSheetByName("커스텀리포트");
  if (!reportSheet) {
    reportSheet = ss.insertSheet("커스텀리포트");
  }
  
  if (!dataSheet || dataSheet.getLastRow() <= 1) {
    Logger.log("인증 데이터가 없습니다.");
    return {userCount: 0, dateRange: "No data"};
  }
  
  if (!userSheet || userSheet.getLastRow() <= 1) {
    Logger.log("등록된 사용자가 없습니다.");
    return {userCount: 0, dateRange: "No users"};
  }
  
  // 날짜 범위를 MM/DD 문자열로 변환
  const startMonth = String(startDate.getMonth() + 1).padStart(2, '0');
  const startDay = String(startDate.getDate()).padStart(2, '0');
  const startDateStr = `${startMonth}/${startDay}`;
  
  const endMonth = String(endDate.getMonth() + 1).padStart(2, '0');
  const endDay = String(endDate.getDate()).padStart(2, '0');
  const endDateStr = `${endMonth}/${endDay}`;
  
  // 일수 계산
  const daysDiff = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
  
  // 리포트 시트 초기화
  reportSheet.clear();
  const dateRange = `${startDate.toLocaleDateString('en-US')} ~ ${endDate.toLocaleDateString('en-US')}`;
  reportSheet.appendRow(["사용자명", "인증 횟수", "인증 날짜들", "누락", "상태", dateRange]);
  
  // 등록된 사용자 목록
  const registeredUsers = userSheet.getRange(2, 1, userSheet.getLastRow() - 1, 1)
    .getValues()
    .map(row => row[0]);
  
  const data = dataSheet.getRange(2, 1, dataSheet.getLastRow() - 1, 4).getValues();
  const userStats = {};
  
  // 등록된 사용자만 초기화
  registeredUsers.forEach(user => {
    userStats[user] = new Set();
  });
  
  // 비교를 위한 날짜 범위 생성 (MM/DD 문자열 배열)
  const dateRangeArray = [];
  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    dateRangeArray.push(`${m}/${day}`);
  }
  
  // 데이터 집계
  for (let i = 0; i < data.length; i++) {
    const username = data[i][2];
    
    // 날짜 처리 (문자열로 변환)
    let dateStr;
    const dateRaw = data[i][1];
    if (dateRaw instanceof Date) {
      const month = String(dateRaw.getMonth() + 1).padStart(2, '0');
      const day = String(dateRaw.getDate()).padStart(2, '0');
      dateStr = month + '/' + day;
    } else {
      dateStr = String(dateRaw).replace(/^'/, '');
    }
    
    // 지정된 날짜 범위 내의 데이터만 (문자열 비교)
    if (registeredUsers.includes(username) && dateRangeArray.includes(dateStr)) {
      userStats[username].add(dateStr);
    }
  }
  
  // 리포트 작성
  const reportData = [];
  for (const username in userStats) {
    const dates = Array.from(userStats[username]).sort();
    const count = dates.length;
    const missing = daysDiff - count;
    const status = missing <= 1 ? "✅ 통과" : `⚠️ ${missing}일 누락`;
    
    reportSheet.appendRow([
      username,
      count,
      dates.join(", ") || "인증 없음",
      missing,
      status
    ]);
    
    reportData.push({username, count, missing, status});
  }
  
  // 스타일링
  const headerRange = reportSheet.getRange(1, 1, 1, 6);
  headerRange.setBackground("#4285f4");
  headerRange.setFontColor("#ffffff");
  headerRange.setFontWeight("bold");
  headerRange.setHorizontalAlignment("center");
  
  // 통과/경고 색상
  if (reportData.length > 0) {
    for (let i = 0; i < reportData.length; i++) {
      const rowRange = reportSheet.getRange(i + 2, 1, 1, 6);
      if (reportData[i].missing <= 1) {
        rowRange.setBackground("#d9ead3");
      } else {
        rowRange.setBackground("#f4cccc");
      }
    }
  }
  
  reportSheet.autoResizeColumns(1, 6);
  
  Logger.log(`커스텀 리포트 생성 완료! (${dateRange}, ${reportData.length}명)`);
  
  return {
    userCount: reportData.length,
    dateRange: dateRange
  };
}

// 관리자 대시보드에서 커스텀 리포트 생성 핸들러
function handleGenerateCustomReport(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    
    // 날짜 문자열을 직접 파싱 (타임존 이슈 방지)
    // "2025-11-25" → [2025, 11, 25]
    const startParts = data.startDate.split('-').map(Number);
    const endParts = data.endDate.split('-').map(Number);
    
    // Date 생성 (월은 0부터 시작하므로 -1)
    const startDate = new Date(startParts[0], startParts[1] - 1, startParts[2]);
    const endDate = new Date(endParts[0], endParts[1] - 1, endParts[2]);
    
    // 날짜 검증
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return ContentService.createTextOutput(JSON.stringify({
        status: "error",
        message: "올바른 날짜 형식이 아닙니다"
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    if (startDate > endDate) {
      return ContentService.createTextOutput(JSON.stringify({
        status: "error",
        message: "시작일이 종료일보다 늦을 수 없습니다"
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    // 리포트 생성 (커스텀리포트 시트 사용)
    const result = generateReportBetweenDatesForCustom(startDate, endDate);
    
    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      message: "커스텀 리포트 생성 완료",
      userCount: result.userCount,
      dateRange: result.dateRange
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// ========================================
// 트리거 설정 (최초 1회만 실행)
// ========================================

function setupWeeklyTrigger() {
  // 기존 트리거 삭제
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(trigger => {
    if (trigger.getHandlerFunction() === 'generateWeeklyReport') {
      ScriptApp.deleteTrigger(trigger);
    }
  });
  
  // 매주 월요일 새벽 2시 59분 (= PST 일요일 밤 11:59)
  // Apps Script는 GMT 기준이므로 PST(GMT-8) 11:59pm = GMT 7:59am
  ScriptApp.newTrigger('generateWeeklyReport')
    .timeBased()
    .onWeekDay(ScriptApp.WeekDay.MONDAY)
    .atHour(7)  // GMT 7시 = PST 11pm (전날)
    .nearMinute(59)  // 7:59am GMT
    .create();
  
  Logger.log("✅ 매주 일요일 밤 11:59 PM (PST)에 자동 리포트 생성 설정 완료!");
}

// ========================================
// 탈락 대상자 찾기 (수동 실행)
// ========================================

function findDropouts() {
  const reportSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("주간리포트");
  
  if (!reportSheet || reportSheet.getLastRow() <= 1) {
    Logger.log("주간리포트를 먼저 생성해주세요. (generateWeeklyReport 실행)");
    return;
  }
  
  const data = reportSheet.getRange(2, 1, reportSheet.getLastRow() - 1, 5).getValues();
  const dropouts = [];
  
  for (let i = 0; i < data.length; i++) {
    const username = data[i][0];
    const missing = data[i][3];
    
    if (missing >= 2) {
      dropouts.push({username, missing});
    }
  }
  
  if (dropouts.length > 0) {
    Logger.log("🚨 탈락 대상자 (" + dropouts.length + "명):");
    dropouts.forEach(user => {
      Logger.log(`  - ${user.username}: ${user.missing}일 누락`);
    });
  } else {
    Logger.log("✅ 탈락 대상자 없음!");
  }
  
  return dropouts;
}

// ========================================
// 관리자용: 사용자 삭제
// ========================================

function handleDeleteUser(e) {
  const data = JSON.parse(e.postData.contents);
  const username = data.username;
  
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const userSheet = ss.getSheetByName("사용자목록");
  const recordSheet = ss.getSheetByName("인증기록");
  
  if (!userSheet || userSheet.getLastRow() <= 1) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: "등록된 사용자가 없습니다"
    })).setMimeType(ContentService.MimeType.JSON);
  }
  
  // 1. 사용자목록에서 사용자 삭제
  const userData = userSheet.getRange(2, 1, userSheet.getLastRow() - 1, 1).getValues();
  let userFound = false;
  
  for (let i = 0; i < userData.length; i++) {
    if (userData[i][0] === username) {
      userSheet.deleteRow(i + 2);
      userFound = true;
      Logger.log(`✅ 사용자목록에서 ${username} 삭제 완료`);
      break;
    }
  }
  
  if (!userFound) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: "사용자를 찾을 수 없습니다"
    })).setMimeType(ContentService.MimeType.JSON);
  }
  
  // 2. 인증기록에서 해당 사용자의 모든 기록 삭제
  let deletedRecords = 0;
  if (recordSheet && recordSheet.getLastRow() > 1) {
    const recordData = recordSheet.getRange(2, 1, recordSheet.getLastRow() - 1, 4).getValues();
    
    // 뒤에서부터 삭제 (인덱스 변화 방지)
    for (let i = recordData.length - 1; i >= 0; i--) {
      if (recordData[i][2] === username) {
        recordSheet.deleteRow(i + 2);
        deletedRecords++;
      }
    }
    
    Logger.log(`✅ 인증기록에서 ${username}의 기록 ${deletedRecords}개 삭제 완료`);
  }
  
  return ContentService.createTextOutput(JSON.stringify({
    status: "success",
    message: "사용자가 삭제되었습니다",
    deletedRecords: deletedRecords
  })).setMimeType(ContentService.MimeType.JSON);
}

// ========================================
// 관리자 대시보드용 API
// ========================================

function getAdminStats() {
  const userSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("사용자목록");
  const recordSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("인증기록");
  
  const totalUsers = userSheet ? userSheet.getLastRow() - 1 : 0;
  const totalCheckins = recordSheet ? recordSheet.getLastRow() - 1 : 0;
  
  // 오늘 인증 수
  let todayCheckins = 0;
  if (recordSheet && recordSheet.getLastRow() > 1) {
    const today = new Date(new Date().toLocaleString("en-US", {timeZone: "America/New_York"}));
    const todayStr = `${String(today.getMonth() + 1).padStart(2, '0')}/${String(today.getDate()).padStart(2, '0')}`;
    
    const records = recordSheet.getRange(2, 1, recordSheet.getLastRow() - 1, 4).getValues();
    todayCheckins = records.filter(row => {
      let dateStr;
      const dateRaw = row[1];
      if (dateRaw instanceof Date) {
        const month = String(dateRaw.getMonth() + 1).padStart(2, '0');
        const day = String(dateRaw.getDate()).padStart(2, '0');
        dateStr = month + '/' + day;
      } else {
        dateStr = String(dateRaw).replace(/^'/, '');
      }
      return dateStr === todayStr;
    }).length;
  }
  
  // 탈락 위험자 수 (주간리포트 기반)
  let dropoutCount = 0;
  const reportSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("주간리포트");
  if (reportSheet && reportSheet.getLastRow() > 1) {
    const reportData = reportSheet.getRange(2, 1, reportSheet.getLastRow() - 1, 5).getValues();
    dropoutCount = reportData.filter(row => row[3] >= 2).length;
  }
  
  return ContentService.createTextOutput(JSON.stringify({
    totalUsers,
    totalCheckins,
    todayCheckins,
    dropoutCount
  })).setMimeType(ContentService.MimeType.JSON);
}

function getUsersWithStats() {
  const userSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("사용자목록");
  const recordSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("인증기록");
  
  if (!userSheet || userSheet.getLastRow() <= 1) {
    return ContentService.createTextOutput(JSON.stringify({
      users: []
    })).setMimeType(ContentService.MimeType.JSON);
  }
  
  const userData = userSheet.getRange(2, 1, userSheet.getLastRow() - 1, 3).getValues();
  const users = [];
  
  userData.forEach(row => {
    const username = row[0];
    const registeredDate = row[2];
    
    // 이 사용자의 인증 기록 카운트
    let checkinCount = 0;
    let lastCheckin = '';
    
    if (recordSheet && recordSheet.getLastRow() > 1) {
      const records = recordSheet.getRange(2, 1, recordSheet.getLastRow() - 1, 4).getValues();
      const userRecords = records.filter(r => r[2] === username);
      checkinCount = userRecords.length;
      
      if (userRecords.length > 0) {
        // ⭐ 타임스탬프 기준으로 정렬 (오래된 것 -> 최신 것)
        userRecords.sort((a, b) => {
          const timeA = new Date(a[0]).getTime();
          const timeB = new Date(b[0]).getTime();
          return timeA - timeB;
        });
        
        // 이제 마지막 항목이 진짜 최신!
        const lastDateRaw = userRecords[userRecords.length - 1][1];
        // Date 객체면 MM/DD로 변환
        if (lastDateRaw instanceof Date) {
          const month = String(lastDateRaw.getMonth() + 1).padStart(2, '0');
          const day = String(lastDateRaw.getDate()).padStart(2, '0');
          lastCheckin = month + '/' + day;
        } else {
          lastCheckin = String(lastDateRaw).replace(/^'/, '');
        }
      }
    }
    
    users.push({
      username,
      registeredDate,
      checkinCount,
      lastCheckin
    });
  });
  
  return ContentService.createTextOutput(JSON.stringify({
    users
  })).setMimeType(ContentService.MimeType.JSON);
}

function getRecentRecords() {
  const recordSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("인증기록");
  
  if (!recordSheet || recordSheet.getLastRow() <= 1) {
    return ContentService.createTextOutput(JSON.stringify({
      records: []
    })).setMimeType(ContentService.MimeType.JSON);
  }
  
  const data = recordSheet.getRange(2, 1, recordSheet.getLastRow() - 1, 4).getValues();
  
  // 최근 20개만
  const recentData = data.slice(-20).reverse();
  
  const records = recentData.map(row => {
    let dateStr;
    const dateRaw = row[1];
    
    // Date 객체면 MM/DD로 변환
    if (dateRaw instanceof Date) {
      const month = String(dateRaw.getMonth() + 1).padStart(2, '0');
      const day = String(dateRaw.getDate()).padStart(2, '0');
      dateStr = month + '/' + day;
    } else {
      dateStr = String(dateRaw).replace(/^'/, '');
    }
    
    return {
      timestamp: row[0],
      date: dateStr,
      username: row[2],
      problem: row[3]
    };
  });
  
  return ContentService.createTextOutput(JSON.stringify({
    records
  })).setMimeType(ContentService.MimeType.JSON);
}