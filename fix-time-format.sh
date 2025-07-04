#!/bin/bash

echo "🔧 디버그 페이지 수정 배포..."

git add public/debug-test.html
git commit -m "fix: 테스트 데이터를 TIME 형식에 맞게 수정"
git push origin main

echo "✅ 완료!"
echo ""
echo "Supabase에서 다음 SQL을 실행하세요:"
echo "ALTER TABLE bookings ALTER COLUMN time TYPE VARCHAR(50);"