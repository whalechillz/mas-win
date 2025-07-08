#!/usr/bin/env python3

import re
from datetime import datetime
import shutil

print("슬랙 알림 파일 수정 시작...")

# notify.js 파일 경로
notify_path = "/Users/m2/MASLABS/win.masgolf.co.kr/pages/api/slack/notify.js"

# 백업 생성
backup_name = f"{notify_path}.backup-{datetime.now().strftime('%Y%m%d-%H%M%S')}"
shutil.copy(notify_path, backup_name)
print(f"백업 생성: {backup_name}")

# 파일 읽기
with open(notify_path, 'r', encoding='utf-8') as f:
    content = f.read()

# booking 섹션에서 priority 필드 추가
booking_pattern = r"fields\.push\(\{\s*type: 'mrkdwn',\s*text: `\*스윙스타일:\* \$\{data\.swing_style \|\| '-'\}`\s*\}\);"

booking_replacement = """fields.push({
          type: 'mrkdwn',
          text: `*스윙스타일:* ${data.swing_style || '-'}`
        });
        // Q2 priority 추가
        if (data.priority) {
          fields.push({
            type: 'mrkdwn',
            text: `*중요요소:* ${data.priority || '-'}`
          });
        }"""

content = re.sub(booking_pattern, booking_replacement, content, count=1)

# contact 섹션에서도 priority 필드 추가
contact_pattern = r"fields\.push\(\{\s*type: 'mrkdwn',\s*text: `\*스윙스타일:\* \$\{data\.swing_style \|\| '-'\}`\s*\}\);"

# 두 번째 occurrence를 위해 먼저 첫 번째를 임시로 치환
temp_content = content.replace('// booking priority placeholder', '', 1)

# contact 섹션 찾기
contact_section_start = temp_content.find("} else if (type === 'contact') {")
if contact_section_start != -1:
    # contact 섹션 내에서만 패턴 찾기
    contact_section = temp_content[contact_section_start:]
    
    # contact 섹션에서 스윙스타일 필드 다음에 priority 추가
    if "text: `*스윙스타일:* ${data.swing_style || '-'}`" in contact_section and "text: `*중요요소:*" not in contact_section:
        contact_section_updated = contact_section.replace(
            """fields.push({
          type: 'mrkdwn',
          text: `*스윙스타일:* ${data.swing_style || '-'}`
        });""",
            """fields.push({
          type: 'mrkdwn',
          text: `*스윙스타일:* ${data.swing_style || '-'}`
        });
        // Q2 priority 추가
        if (data.priority) {
          fields.push({
            type: 'mrkdwn',
            text: `*중요요소:* ${data.priority || '-'}`
          });
        }""", 1)
        
        content = temp_content[:contact_section_start] + contact_section_updated

# 파일 저장
with open(notify_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("슬랙 알림 파일 수정 완료!")
