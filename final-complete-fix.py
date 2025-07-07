#!/usr/bin/env python3

import re
import os
import shutil
from datetime import datetime

print("=== 완전한 Q1, Q2, Q3 수정 스크립트 ===\n")

# 1. 백업 파일들 정리
print("1. 백업 파일들 정리 중...")
backup_html_dir = "/Users/m2/MASLABS/win.masgolf.co.kr/public/versions/backup-html"
versions_dir = "/Users/m2/MASLABS/win.masgolf.co.kr/public/versions"

# HTML 백업 파일들 이동
for file in os.listdir(versions_dir):
    if file.endswith('.backup') or '.backup-' in file:
        src = os.path.join(versions_dir, file)
        dst = os.path.join(backup_html_dir, file)
        if os.path.isfile(src):
            shutil.move(src, dst)
            print(f"  이동: {file}")

# 2. admin.tsx 파일 완전히 다시 수정
print("\n2. 관리자 페이지 수정...")
admin_path = "/Users/m2/MASLABS/win.masgolf.co.kr/pages/admin.tsx"

# 백업 생성
backup_name = f"{admin_path}.backup-{datetime.now().strftime('%Y%m%d-%H%M%S')}"
shutil.copy(admin_path, backup_name)
print(f"  백업 생성: {backup_name}")

with open(admin_path, 'r', encoding='utf-8') as f:
    content = f.read()

# AdminDashboard 함수 시작 부분 찾기
dashboard_start = content.find("export default function AdminDashboard() {")
if dashboard_start == -1:
    print("  ❌ AdminDashboard 함수를 찾을 수 없습니다.")
else:
    # 함수 시작 다음에 변환 함수 추가
    insert_pos = content.find("{", dashboard_start) + 1
    
    conversion_functions = '''
  // 영어 -> 한글 변환 함수
  const convertSwingStyle = (style) => {
    const styles = {
      'stability': '안정형',
      'power': '파워형',
      'hybrid': '복합형'
    };
    return styles[style] || style || '-';
  };

  const convertPriority = (priority) => {
    const priorities = {
      'distance': '비거리',
      'direction': '방향성',
      'comfort': '편안함'
    };
    return priorities[priority] || priority || '-';
  };
'''
    
    # 변환 함수가 없으면 추가
    if "convertSwingStyle" not in content:
        content = content[:insert_pos] + conversion_functions + content[insert_pos:]
        print("  ✓ 변환 함수 추가")
    
    # Bookings 테이블 헤더에 중요요소 추가
    bookings_header_pattern = r'<th[^>]*>스윙타입</th>\s*<th[^>]*>현재거리</th>'
    bookings_header_new = '''<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">스윙타입</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">중요요소</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">현재거리</th>'''
    
    content = re.sub(bookings_header_pattern, bookings_header_new, content, flags=re.DOTALL)
    
    # Bookings 테이블 바디 수정 - convertSwingStyle 사용하도록
    bookings_body_pattern = r'<td[^>]*>\s*\{booking\.swing_style[^}]*\}\s*</td>'
    bookings_body_new = '''<td className="px-6 py-4 text-sm text-gray-900">
                          {convertSwingStyle(booking.swing_style)}
                        </td>'''
    
    content = re.sub(bookings_body_pattern, bookings_body_new, content)
    
    # priority 컬럼 추가 (스윙타입 다음에)
    bookings_add_priority = '''<td className="px-6 py-4 text-sm text-gray-900">
                          {convertSwingStyle(booking.swing_style)}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {convertPriority(booking.priority)}
                        </td>'''
    
    # 스윙타입 td 다음에 priority td가 없으면 추가
    if "convertPriority(booking.priority)" not in content:
        pattern = r'<td className="px-6 py-4 text-sm text-gray-900">\s*\{convertSwingStyle\(booking\.swing_style\)\}\s*</td>'
        content = re.sub(pattern, bookings_add_priority, content)
    
    # Contacts 테이블도 동일하게 수정
    contacts_header_pattern = r'<th[^>]*>스윙타입</th>\s*<th[^>]*>현재거리</th>'
    contacts_header_new = '''<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">스윙타입</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">중요요소</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">현재거리</th>'''
    
    content = re.sub(contacts_header_pattern, contacts_header_new, content, flags=re.DOTALL)
    
    # Contacts 테이블 바디 수정
    contacts_body_pattern = r'<td[^>]*>\s*\{contact\.swing_style[^}]*\}\s*</td>'
    contacts_body_new = '''<td className="px-6 py-4 text-sm text-gray-900">
                          {convertSwingStyle(contact.swing_style)}
                        </td>'''
    
    content = re.sub(contacts_body_pattern, contacts_body_new, content)
    
    # Contacts priority 컬럼 추가
    contacts_add_priority = '''<td className="px-6 py-4 text-sm text-gray-900">
                          {convertSwingStyle(contact.swing_style)}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {convertPriority(contact.priority)}
                        </td>'''
    
    if "convertPriority(contact.priority)" not in content:
        pattern = r'<td className="px-6 py-4 text-sm text-gray-900">\s*\{convertSwingStyle\(contact\.swing_style\)\}\s*</td>'
        content = re.sub(pattern, contacts_add_priority, content)
    
    # CSV 다운로드 수정
    # Bookings CSV
    bookings_csv_old = "['이름', '연락처', '희망날짜', '희망시간', '관심클럽', '신청시간']"
    bookings_csv_new = "['이름', '연락처', '희망날짜', '희망시간', '관심클럽', '스윙타입', '중요요소', '현재거리', '신청시간']"
    content = content.replace(bookings_csv_old, bookings_csv_new)
    
    bookings_csv_data_old = "`${item.name},${item.phone},${item.date},${item.time},${item.club || ''},${item.created_at}\\n`;"
    bookings_csv_data_new = "`${item.name},${item.phone},${item.date},${item.time},${item.club || ''},${convertSwingStyle(item.swing_style)},${convertPriority(item.priority)},${item.current_distance || ''},${item.created_at}\\n`;"
    content = content.replace(bookings_csv_data_old, bookings_csv_data_new)
    
    # Contacts CSV
    contacts_csv_old = "['이름', '연락처', '통화가능시간', '신청시간', '연락여부']"
    contacts_csv_new = "['이름', '연락처', '통화가능시간', '스윙타입', '중요요소', '현재거리', '신청시간', '연락여부']"
    content = content.replace(contacts_csv_old, contacts_csv_new)
    
    contacts_csv_data_old = "`${item.name},${item.phone},${item.call_times || ''},${item.created_at},${item.contacted ? 'O' : 'X'}\\n`;"
    contacts_csv_data_new = "`${item.name},${item.phone},${item.call_times || ''},${convertSwingStyle(item.swing_style)},${convertPriority(item.priority)},${item.current_distance || ''},${item.created_at},${item.contacted ? 'O' : 'X'}\\n`;"
    content = content.replace(contacts_csv_data_old, contacts_csv_data_new)

# 파일 저장
with open(admin_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("  ✓ 관리자 페이지 수정 완료")

# 3. 슬랙 알림 파일 수정
print("\n3. 슬랙 알림 파일 수정...")
slack_path = "/Users/m2/MASLABS/win.masgolf.co.kr/pages/api/slack/notify.js"

# 백업 생성
backup_name = f"{slack_path}.backup-{datetime.now().strftime('%Y%m%d-%H%M%S')}"
shutil.copy(slack_path, backup_name)
print(f"  백업 생성: {backup_name}")

with open(slack_path, 'r', encoding='utf-8') as f:
    slack_content = f.read()

# booking 섹션에서 priority 필드 추가
if "text: `*중요요소:*" not in slack_content:
    # 스윙스타일 다음에 중요요소 추가
    booking_swing_pattern = r"(fields\.push\(\{\s*type: 'mrkdwn',\s*text: `\*스윙스타일:\* \$\{data\.swing_style \|\| '-'\}`\s*\}\);)"
    booking_swing_replacement = r"\1\n        // Q2 priority 추가\n        if (data.priority) {\n          fields.push({\n            type: 'mrkdwn',\n            text: `*중요요소:* ${data.priority || '-'}`\n          });\n        }"
    
    slack_content = re.sub(booking_swing_pattern, booking_swing_replacement, slack_content)
    
    # contact 섹션에서도 priority 필드 추가
    contact_section_start = slack_content.find("} else if (type === 'contact') {")
    if contact_section_start != -1:
        # contact 섹션 내에서 스윙스타일 찾기
        contact_section = slack_content[contact_section_start:]
        contact_swing_pos = contact_section.find("text: `*스윙스타일:* ${data.swing_style || '-'}`")
        
        if contact_swing_pos != -1 and "text: `*중요요소:*" not in contact_section:
            # 스윙스타일 필드 끝 찾기
            field_end = contact_section.find("});", contact_swing_pos) + 3
            insert_text = '''\n        // Q2 priority 추가
        if (data.priority) {
          fields.push({
            type: 'mrkdwn',
            text: `*중요요소:* ${data.priority || '-'}`
          });
        }'''
            
            contact_section = contact_section[:field_end] + insert_text + contact_section[field_end:]
            slack_content = slack_content[:contact_section_start] + contact_section

with open(slack_path, 'w', encoding='utf-8') as f:
    f.write(slack_content)
print("  ✓ 슬랙 알림 파일 수정 완료")

# 4. HTML 파일 수정 (한글 저장)
print("\n4. HTML 파일 수정...")
html_path = "/Users/m2/MASLABS/win.masgolf.co.kr/public/versions/funnel-2025-07-complete.html"

# 백업 생성
backup_name = f"{html_path}.backup-{datetime.now().strftime('%Y%m%d-%H%M%S')}"
shutil.copy(html_path, backup_name)
print(f"  백업 생성: {backup_name}")

with open(html_path, 'r', encoding='utf-8') as f:
    html_content = f.read()

# selectAnswer 함수 수정 - 한글 파라미터 받도록
if "function selectAnswer(step, value, koreanText)" not in html_content:
    html_content = html_content.replace(
        "function selectAnswer(step, value) {",
        "function selectAnswer(step, value, koreanText) {"
    )
    
    # styleText 저장 수정
    html_content = html_content.replace(
        "quizData.style = value;",
        "quizData.style = value;\n                quizData.styleText = koreanText || value;"
    )
    
    # priorityText 저장 수정
    html_content = html_content.replace(
        "quizData.priority = value;",
        "quizData.priority = value;\n                quizData.priorityText = koreanText || value;"
    )

# onclick 이벤트에 한글 파라미터 추가
replacements = [
    ('onclick="selectAnswer(1, \'stability\')"', 'onclick="selectAnswer(1, \'stability\', \'안정형\')"'),
    ('onclick="selectAnswer(1, \'power\')"', 'onclick="selectAnswer(1, \'power\', \'파워형\')"'),
    ('onclick="selectAnswer(1, \'hybrid\')"', 'onclick="selectAnswer(1, \'hybrid\', \'복합형\')"'),
    ('onclick="selectAnswer(2, \'distance\')"', 'onclick="selectAnswer(2, \'distance\', \'비거리\')"'),
    ('onclick="selectAnswer(2, \'direction\')"', 'onclick="selectAnswer(2, \'direction\', \'방향성\')"'),
    ('onclick="selectAnswer(2, \'comfort\')"', 'onclick="selectAnswer(2, \'comfort\', \'편안함\')"'),
]

for old, new in replacements:
    html_content = html_content.replace(old, new)

# 폼 제출 시 한글 데이터 전송
# bookings
html_content = re.sub(
    r'swing_style: quizData\.style \|\| null,',
    'swing_style: quizData.styleText || quizData.style || null,',
    html_content
)

html_content = re.sub(
    r'priority: quizData\.priority \|\| null,',
    'priority: quizData.priorityText || quizData.priority || null,',
    html_content
)

with open(html_path, 'w', encoding='utf-8') as f:
    f.write(html_content)
print("  ✓ HTML 파일 수정 완료")

# 5. SQL 파일 생성
print("\n5. 기존 데이터 한글 변환 SQL 생성...")
sql_content = """-- 기존 영어 데이터를 한글로 변환하는 SQL
-- bookings 테이블
UPDATE bookings
SET priority = CASE
    WHEN priority = 'distance' THEN '비거리'
    WHEN priority = 'direction' THEN '방향성'
    WHEN priority = 'comfort' THEN '편안함'
    ELSE priority
END
WHERE priority IN ('distance', 'direction', 'comfort');

UPDATE bookings
SET swing_style = CASE
    WHEN swing_style = 'stability' THEN '안정형'
    WHEN swing_style = 'power' THEN '파워형'
    WHEN swing_style = 'hybrid' THEN '복합형'
    ELSE swing_style
END
WHERE swing_style IN ('stability', 'power', 'hybrid');

-- contacts 테이블
UPDATE contacts
SET priority = CASE
    WHEN priority = 'distance' THEN '비거리'
    WHEN priority = 'direction' THEN '방향성'
    WHEN priority = 'comfort' THEN '편안함'
    ELSE priority
END
WHERE priority IN ('distance', 'direction', 'comfort');

UPDATE contacts
SET swing_style = CASE
    WHEN swing_style = 'stability' THEN '안정형'
    WHEN swing_style = 'power' THEN '파워형'
    WHEN swing_style = 'hybrid' THEN '복합형'
    ELSE swing_style
END
WHERE swing_style IN ('stability', 'power', 'hybrid');

-- 변경된 데이터 확인
SELECT name, phone, swing_style, priority, current_distance
FROM bookings
ORDER BY created_at DESC
LIMIT 10;
"""

sql_path = "/Users/m2/MASLABS/win.masgolf.co.kr/update-korean-data.sql"
with open(sql_path, 'w', encoding='utf-8') as f:
    f.write(sql_content)
print(f"  ✓ SQL 파일 생성: {sql_path}")

print("\n=== 수정 완료! ===")
print("\n다음 단계:")
print("1. Vercel 배포: vercel --prod")
print("2. Supabase SQL Editor에서 update-korean-data.sql 실행")
print("3. 브라우저 강력 새로고침 (Ctrl+Shift+R)")
print("\n확인 사항:")
print("✓ 관리자 페이지에 '중요요소' 컬럼 표시")
print("✓ 스윙타입: 안정형, 파워형, 복합형 (한글)")
print("✓ 중요요소: 비거리, 방향성, 편안함 (한글)")
print("✓ 슬랙 알림에 Q1, Q2, Q3 모두 표시")
print("✓ CSV 다운로드에 모든 퀴즈 데이터 포함")
