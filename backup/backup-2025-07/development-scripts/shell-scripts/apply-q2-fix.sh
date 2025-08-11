#!/bin/bash

echo "Q2 한글 문제 수정 시작..."

# Python 스크립트 실행 권한 부여
chmod +x /Users/m2/MASLABS/win.masgolf.co.kr/fix-q2-korean.py

# Python 스크립트 실행
cd /Users/m2/MASLABS/win.masgolf.co.kr
python3 fix-q2-korean.py

# 슬랙 알림 파일 직접 수정 (priority 필드 누락 문제 해결)
echo "슬랙 알림 파일 백업..."
cp pages/api/slack/notify.js pages/api/slack/notify.js.backup-$(date +%Y%m%d-%H%M%S)

echo "슬랙 알림에 priority 필드 추가..."
# notify.js 파일에서 스윙스타일 다음에 priority 추가
sed -i '' '/text: `\*스윙스타일:\* ${data.swing_style || '\''-'\''}`/a\
        });\
        // Q2 priority 추가\
        if (data.priority) {\
          fields.push({\
            type: '\''mrkdwn'\'',\
            text: `*중요요소:* ${data.priority || '\''-'\''}`\
          });' pages/api/slack/notify.js

echo "수정 완료!"
echo ""
echo "배포 명령어:"
echo "vercel --prod"
echo ""
echo "DB 업데이트는 Supabase SQL Editor에서 update-korean-data.sql 실행"
