#!/bin/bash

echo "🔍 추적 시스템 디버깅"
echo "===================="
echo ""
echo "1️⃣ API 테스트:"
echo "curl -X POST http://localhost:3000/api/track-view \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -d '{\"campaign_id\":\"2025-07\",\"page\":\"/funnel-2025-07\"}'"
echo ""
echo "2️⃣ 환경변수 테스트:"
echo "http://localhost:3000/api/test-ga4"
echo ""
echo "3️⃣ Supabase 확인:"
echo "1. https://supabase.com 로그인"
echo "2. 프로젝트 → Table Editor"
echo "3. page_views 테이블 확인"
echo "4. campaign_metrics 테이블 확인"
echo ""
echo "4️⃣ 브라우저 콘솔에서 수동 테스트:"
cat << 'CONSOLE_TEST'
// 브라우저 콘솔에 복사해서 실행
fetch('/api/track-view', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    campaign_id: '2025-07',
    page: window.location.pathname
  })
})
.then(res => res.json())
.then(data => console.log('결과:', data))
.catch(err => console.error('에러:', err));
CONSOLE_TEST
