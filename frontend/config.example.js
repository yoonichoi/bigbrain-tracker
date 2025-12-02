// 설정 파일 예시
// 이 파일을 'config.js'로 복사하고 실제 값을 입력하세요
// config.js는 .gitignore에 포함되어 GitHub에 올라가지 않습니다

const CONFIG = {
  // Google Apps Script 웹 앱 URL
  // 배포 후 받은 URL을 여기에 입력하세요
  SCRIPT_URL: 'https://script.google.com/macros/s/YOUR_SCRIPT_ID_HERE/exec',
  
  // 등록코드 (신규 사용자 등록 시 필요)
  // 스터디 그룹 멤버에게만 공유하세요
  REGISTER_CODE: 'your_registration_code_here',
  
  // 관리자 비밀번호 (admin.html에서만 사용)
  ADMIN_PASSWORD: 'YOUR_ADMIN_PASSWORD_HERE',
  
  // 구글 시트 URL (admin.html에서만 사용)
  SHEET_URL: 'https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID_HERE/edit'
};

