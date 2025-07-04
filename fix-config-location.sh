#!/bin/bash

echo "🔧 config.js 위치 수정 배포..."

# Git 상태 확인
echo "📊 변경사항 확인..."
git status

# 변경사항 추가
echo "➕ 변경사항 추가..."
git add -A

# 커밋
echo "💾 커밋..."
git commit -m "fix: config.js 파일을 public 폴더로 이동

- 웹에서 접근 가능하도록 config.js를 public 폴더로 이동
- 404 에러 해결"

# 푸시
echo "📤 푸시..."
git push origin main

echo "✅ 완료! Vercel이 자동으로 재배포됩니다."
echo "1-2분 후 다시 테스트해보세요: https://win.masgolf.co.kr/debug-test.html"
