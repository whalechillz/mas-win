#!/usr/bin/env python3

import re

print("관리자 페이지 수정 시작...")

# admin.tsx 파일 읽기
admin_path = "/Users/m2/MASLABS/win.masgolf.co.kr/pages/admin.tsx"
with open(admin_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 백업 생성
import shutil
from datetime import datetime
backup_name = f"{admin_path}.backup-{datetime.now().strftime('%Y%m%d-%H%M%S')}"
shutil.copy(admin_path, backup_name)
print(f"백업 생성: {backup_name}")

# 1. 한글 변환 함수 추가
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

# AdminDashboard 함수 시작 부분에 변환 함수 추가
pattern = r'export default function AdminDashboard\(\) \{\s*const \[supabase'
replacement = '''export default function AdminDashboard() {
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

  const [supabase'''

content = re.sub(pattern, replacement, content, flags=re.DOTALL)

# 2. Bookings 테이블에 중요요소 컬럼 추가
# 테이블 헤더 수정
bookings_header_old = '''<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">스윙타입</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">현재거리</th>'''

bookings_header_new = '''<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">스윙타입</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">중요요소</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">현재거리</th>'''

content = content.replace(bookings_header_old, bookings_header_new)

# 테이블 바디 수정 - 스윙타입 한글 변환 + priority 컬럼 추가
bookings_body_old = '''<td className="px-6 py-4 text-sm text-gray-900">
                          {booking.swing_style || '-'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {booking.current_distance ? `${booking.current_distance}m` : '-'}
                        </td>'''

bookings_body_new = '''<td className="px-6 py-4 text-sm text-gray-900">
                          {convertSwingStyle(booking.swing_style)}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {convertPriority(booking.priority)}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {booking.current_distance ? `${booking.current_distance}m` : '-'}
                        </td>'''

content = content.replace(bookings_body_old, bookings_body_new)

# 3. Contacts 테이블에 중요요소 컬럼 추가
# 테이블 헤더 수정
contacts_header_old = '''<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">스윙타입</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">현재거리</th>'''

contacts_header_new = '''<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">스윙타입</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">중요요소</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">현재거리</th>'''

content = content.replace(contacts_header_old, contacts_header_new)

# 테이블 바디 수정 - 스윙타입 한글 변환 + priority 컬럼 추가
contacts_body_old = '''<td className="px-6 py-4 text-sm text-gray-900">
                          {contact.swing_style || '-'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {contact.current_distance ? `${contact.current_distance}m` : '-'}
                        </td>'''

contacts_body_new = '''<td className="px-6 py-4 text-sm text-gray-900">
                          {convertSwingStyle(contact.swing_style)}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {convertPriority(contact.priority)}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {contact.current_distance ? `${contact.current_distance}m` : '-'}
                        </td>'''

content = content.replace(contacts_body_old, contacts_body_new)

# 4. CSV 내보내기에 priority 추가
# Bookings CSV
bookings_csv_headers_old = "['이름', '연락처', '희망날짜', '희망시간', '관심클럽', '신청시간']"
bookings_csv_headers_new = "['이름', '연락처', '희망날짜', '희망시간', '관심클럽', '스윙타입', '중요요소', '현재거리', '신청시간']"

content = content.replace(bookings_csv_headers_old, bookings_csv_headers_new)

bookings_csv_data_old = "`${item.name},${item.phone},${item.date},${item.time},${item.club || ''},${item.created_at}\\n`;"
bookings_csv_data_new = "`${item.name},${item.phone},${item.date},${item.time},${item.club || ''},${convertSwingStyle(item.swing_style)},${convertPriority(item.priority)},${item.current_distance || ''},${item.created_at}\\n`;"

content = content.replace(bookings_csv_data_old, bookings_csv_data_new)

# Contacts CSV
contacts_csv_headers_old = "['이름', '연락처', '통화가능시간', '신청시간', '연락여부']"
contacts_csv_headers_new = "['이름', '연락처', '통화가능시간', '스윙타입', '중요요소', '현재거리', '신청시간', '연락여부']"

content = content.replace(contacts_csv_headers_old, contacts_csv_headers_new)

contacts_csv_data_old = "`${item.name},${item.phone},${item.call_times || ''},${item.created_at},${item.contacted ? 'O' : 'X'}\\n`;"
contacts_csv_data_new = "`${item.name},${item.phone},${item.call_times || ''},${convertSwingStyle(item.swing_style)},${convertPriority(item.priority)},${item.current_distance || ''},${item.created_at},${item.contacted ? 'O' : 'X'}\\n`;"

content = content.replace(contacts_csv_data_old, contacts_csv_data_new)

# 5. 최근 시타 예약 섹션에도 한글 변환 적용
recent_bookings_old = '''<p className="text-sm text-gray-500">{booking.club || '클럽 미정'}</p>'''
recent_bookings_new = '''<p className="text-sm text-gray-500">{booking.club || '클럽 미정'} | {convertSwingStyle(booking.swing_style)}</p>'''

content = content.replace(recent_bookings_old, recent_bookings_new)

# 파일 저장
with open(admin_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("관리자 페이지 수정 완료!")
print("\n다음 단계:")
print("1. Vercel 재배포: vercel --prod")
print("2. 브라우저 캐시 삭제 후 테스트")
