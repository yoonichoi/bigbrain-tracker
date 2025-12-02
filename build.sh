#!/bin/bash

# Netlify 환경 변수로부터 frontend/config.js 생성
cat > frontend/config.js << EOF
// 자동 생성된 설정 파일 (Netlify 빌드 시)
const CONFIG = {
  SCRIPT_URL: '${SCRIPT_URL}',
  REGISTER_CODE: '${REGISTER_CODE}',
  ADMIN_PASSWORD: '${ADMIN_PASSWORD}',
  SHEET_URL: '${SHEET_URL}'
};
EOF

echo "✅ config.js 생성 완료!"
cat config.js

