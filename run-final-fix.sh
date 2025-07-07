#!/bin/bash

echo "=== 최종 완전 수정 스크립트 실행 ==="
echo ""

cd /Users/m2/MASLABS/win.masgolf.co.kr

# Python 스크립트 실행
chmod +x final-complete-fix.py
python3 final-complete-fix.py

echo ""
echo "=== 배포 준비 완료 ==="
echo ""
echo "배포 명령어:"
echo "vercel --prod"
echo ""
echo "⚠️  중요: 브라우저 캐시를 완전히 삭제하세요!"
echo "Chrome: Ctrl+Shift+R (Windows) / Cmd+Shift+R (Mac)"
echo "또는 개발자도구 > Network > Disable cache 체크"
