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
