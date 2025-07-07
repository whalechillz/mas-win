#!/bin/bash

echo "관리자 페이지 및 슬랙 알림 수정 시작..."

cd /Users/m2/MASLABS/win.masgolf.co.kr

# 1. 관리자 페이지 수정
echo "1. 관리자 페이지 수정..."
chmod +x fix-admin-page.py
python3 fix-admin-page.py

# 2. 이전에 만든 Q2 수정 스크립트도 실행
echo "2. Q2 한글 변환 및 슬랙 알림 수정..."
if [ -f "fix-q2-korean.py" ]; then
    chmod +x fix-q2-korean.py
    python3 fix-q2-korean.py
fi

# 3. 배포
echo ""
echo "수정 완료! 다음 명령어로 배포하세요:"
echo ""
echo "vercel --prod"
echo ""
echo "배포 후 확인사항:"
echo "1. 관리자 페이지에서 '중요요소' 컬럼 표시 확인"
echo "2. 스윙타입이 한글로 표시되는지 확인 (안정형, 파워형, 복합형)"
echo "3. 중요요소가 한글로 표시되는지 확인 (비거리, 방향성, 편안함)"
echo "4. CSV 다운로드에도 Q2 데이터 포함 확인"
echo "5. 슬랙 알림에 Q2 내용 포함 확인"
echo ""
echo "Supabase SQL Editor에서 기존 데이터 변환:"
echo "update-korean-data.sql 파일 실행"
