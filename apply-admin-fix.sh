#!/bin/bash

echo "=== 관리자 페이지 완전 수정 ==="
echo ""

cd /Users/m2/MASLABS/win.masgolf.co.kr

# Python 스크립트 실행
chmod +x fix-admin-complete.py
python3 fix-admin-complete.py

echo ""
echo "다음 단계:"
echo "1. vercel --prod"
echo "2. 브라우저 캐시 완전 삭제 (Ctrl+Shift+R)"
echo ""
echo "확인 사항:"
echo "✓ 스윙타입 컬럼: 안정형, 파워형, 복합형 (한글)"
echo "✓ 중요요소 컬럼: 비거리, 방향성, 편안함 (한글)"
echo "✓ 현재거리 컬럼: 180m, 200m 등"
echo "✓ CSV 다운로드에 모든 데이터 포함"
