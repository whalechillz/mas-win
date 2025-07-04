#!/bin/bash

echo "🚀 Supabase 연결 설정 배포..."

# Git 상태 확인
echo "📊 변경사항 확인..."
git status

# 변경사항 추가
echo "➕ 변경사항 추가..."
git add public/config.js
git add public/js/database-handler.js

# 커밋
echo "💾 커밋..."
git commit -m "feat: Supabase 연결 설정 완료

- 실제 Supabase URL과 API 키 설정
- 데이터베이스 테이블 구조에 맞게 컬럼명 수정
  - preferred_date → date
  - preferred_time → time  
  - club_interest → club"

# 푸시
echo "📤 푸시..."
git push origin main

echo "✅ 완료! Vercel이 자동으로 재배포됩니다."
echo ""
echo "1-2분 후 테스트:"
echo "1. https://win.masgolf.co.kr/debug-test.html 접속"
echo "2. 데이터베이스 연결 테스트 버튼 클릭"
echo "3. 시타 예약 저장 테스트 버튼 클릭"
