#!/bin/bash

echo "🔧 컬럼명 수정 배포..."

git add public/js/database-handler.js
git commit -m "fix: contacts 테이블의 call_times 컬럼명 수정"
git push origin main

echo "✅ 완료!"
echo ""
echo "🎉 이제 모든 기능이 작동할 것입니다!"
echo "테스트: https://win.masgolf.co.kr/debug-test.html"