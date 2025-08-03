#!/bin/bash

# 플립 카드 수정 스크립트
# 백업 생성
echo "백업 파일 생성 중..."
cp /Users/m2/MASLABS/win.masgolf.co.kr/public/versions/funnel-2025-08-vacation-final.html \
   /Users/m2/MASLABS/win.masgolf.co.kr/public/versions/funnel-2025-08-vacation-final-backup-$(date +%Y%m%d_%H%M%S).html

echo "백업 완료! 이제 플립 카드 수정을 진행합니다."