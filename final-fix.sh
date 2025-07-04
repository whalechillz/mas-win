#!/bin/bash

echo "🚀 최종 Supabase URL 수정 배포..."

git add -A
git commit -m "fix: Supabase URL 최종 수정 - 표준 형식 적용"
git push origin main

echo "✅ 완료! 1-2분 후 테스트하세요."
echo "테스트 URL: https://win.masgolf.co.kr/debug-test.html"