#!/bin/bash

echo "🚀 관리자 페이지 배포..."

git add public/admin.html
git commit -m "feat: Supabase 연동 관리자 페이지 추가

- 실시간 데이터 조회
- 시타 예약 및 문의 관리
- CSV 다운로드 기능
- 삭제 및 상태 업데이트 기능
- 통계 대시보드"

git push origin main

echo "✅ 배포 완료!"
echo ""
echo "📊 관리자 페이지 접속:"
echo "https://win.masgolf.co.kr/admin.html"
echo ""
echo "⚠️  보안 주의사항:"
echo "- 실제 운영 시에는 비밀번호 보호 추가 필요"
echo "- 접근 권한 관리 필요"