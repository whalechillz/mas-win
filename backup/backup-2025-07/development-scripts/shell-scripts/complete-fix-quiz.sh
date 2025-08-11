#!/bin/bash

echo "=== Q1, Q2, Q3 완전 수정 스크립트 ==="
echo ""

cd /Users/m2/MASLABS/win.masgolf.co.kr

# 1. 슬랙 알림 파일 수정 (priority 필드 추가)
echo "1. 슬랙 알림에 Q2(중요요소) 추가..."
chmod +x fix-slack-notify.py
python3 fix-slack-notify.py

# 2. 관리자 페이지 수정 (priority 컬럼 추가, 한글 변환)
echo ""
echo "2. 관리자 페이지 수정..."
chmod +x fix-admin-page.py
python3 fix-admin-page.py

# 3. 퀴즈 HTML 파일 수정 (한글 저장)
echo ""
echo "3. 퀴즈 페이지 한글 변환..."
if [ -f "fix-q2-korean.py" ]; then
    chmod +x fix-q2-korean.py
    python3 fix-q2-korean.py
fi

# 4. SQL 파일 확인
echo ""
echo "4. 데이터베이스 업데이트 SQL 생성 확인..."
if [ -f "update-korean-data.sql" ]; then
    echo "✓ update-korean-data.sql 파일이 생성되었습니다."
    echo "  Supabase SQL Editor에서 실행하세요."
else
    echo "✗ update-korean-data.sql 파일이 없습니다."
fi

echo ""
echo "=== 수정 완료! ==="
echo ""
echo "다음 단계:"
echo "1. Vercel 배포: vercel --prod"
echo "2. Supabase SQL Editor에서 update-korean-data.sql 실행"
echo "3. 브라우저 캐시 삭제 (Ctrl+Shift+R)"
echo ""
echo "확인 사항:"
echo "✓ 관리자 페이지에 '중요요소' 컬럼 표시"
echo "✓ 스윙타입: 안정형, 파워형, 복합형 (한글)"
echo "✓ 중요요소: 비거리, 방향성, 편안함 (한글)"
echo "✓ 슬랙 알림에 Q1, Q2, Q3 모두 표시"
echo "✓ CSV 다운로드에 모든 퀴즈 데이터 포함"
