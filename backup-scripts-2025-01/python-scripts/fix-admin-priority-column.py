#!/usr/bin/env python3
import re
import os
from datetime import datetime

# admin.tsx 파일 경로
admin_path = "/Users/m2/MASLABS/win.masgolf.co.kr/pages/admin.tsx"

# 백업 생성
backup_path = f"{admin_path}.backup-{datetime.now().strftime('%Y%m%d-%H%M%S')}"
os.system(f"cp '{admin_path}' '{backup_path}'")
print(f"백업 생성: {backup_path}")

# 파일 읽기
with open(admin_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Bookings 테이블 헤더에 중요요소 추가
bookings_header_pattern = r'(<th[^>]*>스윙타입</th>\s*)'
bookings_header_replacement = r'\1<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">중요요소</th>\n                      '

content = re.sub(bookings_header_pattern, bookings_header_replacement, content)

# 2. Bookings 테이블 데이터 행에 중요요소 추가
bookings_data_pattern = r'(<td className="px-6 py-4 text-sm text-gray-900">\s*{booking\.swing_style \|\| \'-\'}\s*</td>\s*)'
bookings_data_replacement = r'''\1<td className="px-6 py-4 text-sm text-gray-900">
                          {booking.priority || '-'}
                        </td>
                        '''

content = re.sub(bookings_data_pattern, bookings_data_replacement, content)

# 3. Contacts 테이블 헤더에도 중요요소 추가
contacts_header_pattern = r'(<th[^>]*>스윙타입</th>)'
contacts_header_replacement = r'\1\n                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">중요요소</th>'

# contacts 테이블 부분만 수정
contacts_section = content.split('{activeTab === \'contacts\'')[1].split('{activeTab')[0]
modified_contacts = re.sub(contacts_header_pattern, contacts_header_replacement, contacts_section)
content = content.replace(contacts_section, modified_contacts)

# 4. Contacts 테이블 데이터 행에 중요요소 추가
contacts_data_pattern = r'(<td className="px-6 py-4 text-sm text-gray-900">\s*{contact\.swing_style \|\| \'-\'}\s*</td>)'
contacts_data_replacement = r'''\1
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {contact.priority || '-'}
                        </td>'''

content = re.sub(contacts_data_pattern, contacts_data_replacement, content)

# 파일 저장
with open(admin_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("\n✅ 관리자 페이지에 중요요소 컬럼 추가 완료!")
print("\n수정 내용:")
print("- 시타 예약 테이블에 '중요요소' 컬럼 추가")
print("- 문의 관리 테이블에 '중요요소' 컬럼 추가")
print("\n다음 단계:")
print("1. 로컬 테스트: npm run dev")
print("2. 배포: vercel --prod")
