#!/bin/bash

echo "🔍 GA4 및 Service Account 정보 확인 가이드"
echo "========================================="
echo ""
echo "1️⃣ GA4 Property ID 확인:"
echo "   1. https://analytics.google.com 접속"
echo "   2. 좌측 하단 ⚙️ 관리 클릭"
echo "   3. 속성 → 속성 세부정보"
echo "   4. '속성 ID' 확인 (숫자만, 예: 415123120)"
echo ""
echo "2️⃣ Service Account 생성:"
echo "   1. https://console.cloud.google.com 접속"
echo "   2. 새 프로젝트 생성 또는 선택"
echo "   3. API 및 서비스 → 라이브러리"
echo "   4. 'Google Analytics Data API' 검색 → 사용"
echo "   5. API 및 서비스 → 사용자 인증 정보"
echo "   6. '+ 사용자 인증 정보 만들기' → 서비스 계정"
echo "   7. 이름: masgolf-ga4-reader"
echo "   8. 생성 완료 후 해당 계정 클릭"
echo "   9. 키 탭 → 키 추가 → JSON → 만들기"
echo "   10. JSON 파일 다운로드됨"
echo ""
echo "3️⃣ 다운로드된 JSON 파일에서:"
echo "   - client_email: GOOGLE_SERVICE_ACCOUNT_EMAIL"
echo "   - private_key: GOOGLE_SERVICE_ACCOUNT_KEY"
echo ""
echo "4️⃣ GA4에 권한 부여:"
echo "   1. GA4 관리 → 계정 → 계정 액세스 관리"
echo "   2. + 버튼 → 사용자 추가"
echo "   3. 위의 client_email 입력"
echo "   4. 권한: 뷰어"
echo "   5. 추가"
echo ""
echo "5️⃣ .env.local 파일 예시:"
echo "----------------------------------------"
cat << 'ENV_EXAMPLE'
# GA4 설정
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-SMJWL2TRM7
GA4_PROPERTY_ID=여기에_속성ID_입력

# Service Account (JSON 파일에서 복사)
GOOGLE_SERVICE_ACCOUNT_EMAIL=여기에_client_email_입력
GOOGLE_SERVICE_ACCOUNT_KEY="여기에_private_key_전체_입력"
ENV_EXAMPLE
echo "----------------------------------------"
echo ""
echo "⚠️ 주의사항:"
echo "  - Private Key는 큰따옴표로 감싸기"
echo "  - \\n은 그대로 유지"
echo "  - .gitignore에 .env.local 포함 확인"
echo ""
echo "📝 JSON 파일 내용 확인:"
echo "  cat ~/Downloads/*.json | grep -E 'client_email|private_key'"
