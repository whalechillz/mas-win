#!/bin/bash

echo "📦 마케팅 대시보드를 위한 추가 패키지 설치 중..."

# date-fns 설치 (날짜 처리 라이브러리)
npm install date-fns

echo "✅ 설치 완료!"
echo ""
echo "📝 다음 단계:"
echo "1. Supabase에서 새로운 테이블 생성하기:"
echo "   - database/blog_calendar_schema.sql 파일을 Supabase SQL Editor에서 실행"
echo ""
echo "2. 개발 서버 재시작:"
echo "   npm run dev"
echo ""
echo "3. 플랫폼 주소 수정 (선택사항):"
echo "   기존 DB가 있다면 /database/update_blog_urls.sql 파일 실행"
echo "   또는 Admin > 마케팅 콘텐츠 > 플랫폼 설정에서 직접 수정"
echo ""
echo "4. 브라우저에서 확인:"
echo "   https://win.masgolf.co.kr/admin"
echo "   로그인 후 '마케팅 콘텐츠' 탭 확인"
