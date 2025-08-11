#!/bin/bash

echo "=== 슬랙 알림 완전 수정 ==="
echo ""

cd /Users/m2/MASLABS/win.masgolf.co.kr

# 1. 슬랙 알림 디자인 적용
echo "1. 슬랙 알림 디자인 개선..."
cp pages/api/slack/notify.js pages/api/slack/notify.js.backup-$(date +%Y%m%d-%H%M%S)
cp pages/api/slack/notify-beautiful.js pages/api/slack/notify.js

# 2. HTML 파일의 슬랙 전송 데이터 수정
echo "2. HTML 파일 수정..."
HTML_FILE="/Users/m2/MASLABS/win.masgolf.co.kr/public/versions/funnel-2025-07-complete.html"

# 백업 생성
cp "$HTML_FILE" "$HTML_FILE.backup-$(date +%Y%m%d-%H%M%S)"

# Python 스크립트로 수정
cat > fix-slack-data.py << 'EOF'
#!/usr/bin/env python3
import re

html_path = "/Users/m2/MASLABS/win.masgolf.co.kr/public/versions/funnel-2025-07-complete.html"

with open(html_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 슬랙 알림 데이터 전송 부분 수정
# booking 부분
booking_pattern = r"(data: {\s*name: data\.name,\s*phone: data\.phone,\s*date: data\.date,\s*time: data\.time,\s*club: data\.club,)"
booking_replacement = r"\1"

# 퀴즈 데이터 추가 부분 수정 - 올바른 priority 데이터 전송
quiz_data_pattern = r"(// 퀴즈 데이터 추가\s*swing_style: quizData\.styleText[^,]*,)\s*(priority: quizData\.\w+[^,]*,)"
quiz_data_replacement = r"\1\n                                    priority: quizData.priorityText || quizData.priority || null,"

content = re.sub(quiz_data_pattern, quiz_data_replacement, content)

# 저장
with open(html_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("✓ HTML 파일 수정 완료")
EOF

python3 fix-slack-data.py

echo ""
echo "✅ 슬랙 알림 완전 수정 완료!"
echo ""
echo "수정 내용:"
echo "1. 개선된 디자인 적용 (섹션별 구조화, 이모지, 버튼 추가)"
echo "2. 중요요소 데이터 올바르게 전송 (priorityText 사용)"
echo ""
echo "배포 명령어:"
echo "vercel --prod"
echo ""
echo "⚠️ 중요: 배포 후 브라우저 캐시를 완전히 삭제하세요!"
echo "Chrome: Ctrl+Shift+R (Windows) / Cmd+Shift+R (Mac)"
