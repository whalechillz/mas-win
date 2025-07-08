#!/bin/bash
echo "=== 슬랙 알림 완전 수정 스크립트 ==="
echo ""

cd /Users/m2/MASLABS/win.masgolf.co.kr

# 1. 슬랙 알림 디자인 적용
echo "1. 슬랙 알림 디자인 개선 적용 중..."
if [ -f "pages/api/slack/notify-beautiful.js" ]; then
    cp pages/api/slack/notify.js pages/api/slack/notify.js.backup-$(date +%Y%m%d-%H%M%S)
    cp pages/api/slack/notify-beautiful.js pages/api/slack/notify.js
    echo "✓ 개선된 슬랙 디자인 적용 완료"
else
    echo "✗ notify-beautiful.js 파일을 찾을 수 없습니다"
fi

# 2. Python 스크립트 생성 및 실행
echo ""
echo "2. HTML 파일의 슬랙 데이터 전송 수정 중..."

cat > fix-slack-priority.py << 'EOF'
#!/usr/bin/env python3
import re
import os
from datetime import datetime

html_path = "/Users/m2/MASLABS/win.masgolf.co.kr/public/versions/funnel-2025-07-complete.html"

# 백업 생성
backup_path = f"{html_path}.backup-{datetime.now().strftime('%Y%m%d-%H%M%S')}"
os.system(f"cp '{html_path}' '{backup_path}'")
print(f"백업 생성: {backup_path}")

# HTML 파일 읽기
with open(html_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 수정 전 priority 관련 코드 찾기
print("\n수정 전 priority 관련 코드:")
priority_pattern = r'priority:\s*quizData\.[^\s,}]+[^,}]*'
matches = re.findall(priority_pattern, content)
for match in matches[:3]:  # 처음 3개만 표시
    print(f"  - {match}")

# priority 데이터 전송 수정
# quizData.priority가 아닌 quizData.priorityText를 사용하도록 수정
content = re.sub(
    r'priority:\s*quizData\.priority\s*\|\|\s*null',
    'priority: quizData.priorityText || quizData.priority || null',
    content
)

content = re.sub(
    r'priority:\s*quizData\.priority(?![A-Za-z])',
    'priority: quizData.priorityText || quizData.priority || null',
    content
)

# 저장
with open(html_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("\n✓ HTML 파일 수정 완료")
print("  - priority 데이터가 priorityText를 우선 사용하도록 수정됨")
EOF

python3 fix-slack-priority.py

echo ""
echo "=== 수정 완료 ==="
echo ""
echo "수정 내용:"
echo "1. ✓ 슬랙 알림 디자인 개선 (이모지, 섹션 구조, 버튼 추가)"
echo "2. ✓ 중요요소 데이터 수정 (priorityText 사용)"
echo ""
echo "다음 단계:"
echo "1. 브라우저 캐시 삭제 (Ctrl+Shift+R 또는 Cmd+Shift+R)"
echo "2. 배포: vercel --prod"
echo ""
echo "⚠️  중요: 정적 HTML 파일이 수정되므로 브라우저 캐시를 완전히 삭제해야 합니다!"
