#!/bin/bash

echo "🔧 Supabase URL 수정 배포..."

git add public/config.js
git commit -m "fix: Supabase URL 수정 - 올바른 프로젝트 ID로 변경"
git push origin main

echo "✅ 완료! 1-2분 후 다시 테스트해보세요."