#!/usr/bin/env python3

import re
from datetime import datetime
import shutil

print("=== 관리자 페이지 완전 수정 ===")

# admin.tsx 파일 경로
admin_path = "/Users/m2/MASLABS/win.masgolf.co.kr/pages/admin.tsx"

# 백업 생성
backup_name = f"{admin_path}.backup-{datetime.now().strftime('%Y%m%d-%H%M%S')}"
shutil.copy(admin_path, backup_name)
print(f"백업 생성: {backup_name}")

# 파일 읽기
with open(admin_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. AdminDashboard 함수에 변환 함수 추가
print("\n1. 변환 함수 추가...")
dashboard_start = content.find("export default function AdminDashboard() {")
if dashboard_start != -1:
    # 함수 시작 바로 다음에 추가
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
        print("  ✓ 변환 함수 추가 완료")

# 2. Bookings 테이블 수정
print("\n2. Bookings 테이블 수정...")

# 테이블 헤더 찾기 - priority 컬럼 추가
bookings_header_pattern = r'(<th[^>]*>스윙타입</th>\s*)(<th[^>]*>현재거리</th>)'
bookings_header_replacement = r'\1<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">중요요소</th>\n                      \2'

content = re.sub(bookings_header_pattern, bookings_header_replacement, content)

# 테이블 바디 수정 - swing_style 표시 부분을 변환 함수 사용하도록
bookings_swing_pattern = r'<td className="px-6 py-4 text-sm text-gray-900">\s*\{booking\.swing_style \|\| \'-\'\}\s*</td>'
bookings_swing_replacement = '''<td className="px-6 py-4 text-sm text-gray-900">
                          {convertSwingStyle(booking.swing_style)}
                        </td>'''

content = re.sub(bookings_swing_pattern, bookings_swing_replacement, content)

# priority 컬럼 추가 - 스윙타입 td 다음에
bookings_priority_pattern = r'(<td className="px-6 py-4 text-sm text-gray-900">\s*\{convertSwingStyle\(booking\.swing_style\)\}\s*</td>\s*)(<td className="px-6 py-4 text-sm text-gray-900">\s*\{booking\.current_distance)'
bookings_priority_replacement = r'''\1<td className="px-6 py-4 text-sm text-gray-900">
                          {convertPriority(booking.priority)}
                        </td>
                        \2'''

content = re.sub(bookings_priority_pattern, bookings_priority_replacement, content)

# 3. Contacts 테이블 수정
print("\n3. Contacts 테이블 수정...")

# 테이블 헤더 - priority 컬럼 추가
contacts_header_pattern = r'(<th[^>]*>스윙타입</th>\s*)(<th[^>]*>현재거리</th>)'
contacts_header_replacement = r'\1<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">중요요소</th>\n                      \2'

content = re.sub(contacts_header_pattern, contacts_header_replacement, content)

# 테이블 바디 수정 - swing_style 표시 부분을 변환 함수 사용하도록
contacts_swing_pattern = r'<td className="px-6 py-4 text-sm text-gray-900">\s*\{contact\.swing_style \|\| \'-\'\}\s*</td>'
contacts_swing_replacement = '''<td className="px-6 py-4 text-sm text-gray-900">
                          {convertSwingStyle(contact.swing_style)}
                        </td>'''

content = re.sub(contacts_swing_pattern, contacts_swing_replacement, content)

# priority 컬럼 추가 - 스윙타입 td 다음에
contacts_priority_pattern = r'(<td className="px-6 py-4 text-sm text-gray-900">\s*\{convertSwingStyle\(contact\.swing_style\)\}\s*</td>\s*)(<td className="px-6 py-4 text-sm text-gray-900">\s*\{contact\.current_distance)'
contacts_priority_replacement = r'''\1<td className="px-6 py-4 text-sm text-gray-900">
                          {convertPriority(contact.priority)}
                        </td>
                        \2'''

content = re.sub(contacts_priority_pattern, contacts_priority_replacement, content)

# 4. CSV 내보내기 수정
print("\n4. CSV 내보내기 수정...")

# Bookings CSV 헤더
content = content.replace(
    "['이름', '연락처', '희망날짜', '희망시간', '관심클럽', '신청시간']",
    "['이름', '연락처', '희망날짜', '희망시간', '관심클럽', '스윙타입', '중요요소', '현재거리', '신청시간']"
)

# Bookings CSV 데이터
content = content.replace(
    "`${item.name},${item.phone},${item.date},${item.time},${item.club || ''},${item.created_at}\\n`;",
    "`${item.name},${item.phone},${item.date},${item.time},${item.club || ''},${convertSwingStyle(item.swing_style)},${convertPriority(item.priority)},${item.current_distance || ''},${item.created_at}\\n`;"
)

# Contacts CSV 헤더
content = content.replace(
    "['이름', '연락처', '통화가능시간', '신청시간', '연락여부']",
    "['이름', '연락처', '통화가능시간', '스윙타입', '중요요소', '현재거리', '신청시간', '연락여부']"
)

# Contacts CSV 데이터
content = content.replace(
    "`${item.name},${item.phone},${item.call_times || ''},${item.created_at},${item.contacted ? 'O' : 'X'}\\n`;",
    "`${item.name},${item.phone},${item.call_times || ''},${convertSwingStyle(item.swing_style)},${convertPriority(item.priority)},${item.current_distance || ''},${item.created_at},${item.contacted ? 'O' : 'X'}\\n`;"
)

# 5. 최근 활동 섹션에도 스타일 정보 추가
print("\n5. 최근 활동 섹션 수정...")
recent_pattern = r'<p className="text-sm text-gray-500">\{booking\.club \|\| \'클럽 미정\'\}</p>'
recent_replacement = '''<p className="text-sm text-gray-500">{booking.club || '클럽 미정'} | {convertSwingStyle(booking.swing_style)}</p>'''

content = re.sub(recent_pattern, recent_replacement, content)

# 파일 저장
with open(admin_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("\n✅ 관리자 페이지 수정 완료!")
print("\n수정 내용:")
print("✓ 한글 변환 함수 추가 (convertSwingStyle, convertPriority)")
print("✓ 시타 예약 테이블에 '중요요소' 컬럼 추가")
print("✓ 문의 관리 테이블에 '중요요소' 컬럼 추가")
print("✓ 스윙타입 한글 표시 (안정형, 파워형, 복합형)")
print("✓ 중요요소 한글 표시 (비거리, 방향성, 편안함)")
print("✓ CSV 다운로드에 모든 퀴즈 데이터 포함")
print("✓ 최근 활동에 스윙타입 표시")
