import re

# admin.tsx 파일 읽기
with open('pages/admin.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. 예약 테이블 헤더에 퀴즈 컬럼 추가
# "관심클럽" 다음에 퀴즈 컬럼 추가
booking_header_pattern = r'(<th[^>]*>관심클럽</th>)'
booking_header_replacement = '''\\1
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">스윙타입</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">현재거리</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">추천플렉스</th>'''

content = re.sub(booking_header_pattern, booking_header_replacement, content, flags=re.DOTALL)

# 2. 예약 테이블 바디에 퀴즈 데이터 표시
# club 데이터 다음에 퀴즈 데이터 추가
booking_body_pattern = r'(<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">\s*{booking\.club[^}]*}\s*</td>)'
booking_body_replacement = '''\\1
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {booking.swing_style || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {booking.current_distance ? `${booking.current_distance}m` : '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {booking.recommended_flex || '-'}
                </td>'''

content = re.sub(booking_body_pattern, booking_body_replacement, content, flags=re.DOTALL)

# 3. 문의 테이블 헤더에도 퀴즈 컬럼 추가
contact_header_pattern = r'(<th[^>]*>통화가능시간</th>)'
contact_header_replacement = '''\\1
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">스윙타입</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">현재거리</th>'''

content = re.sub(contact_header_pattern, contact_header_replacement, content, flags=re.DOTALL)

# 4. 문의 테이블 바디에 퀴즈 데이터 표시
contact_body_pattern = r'(<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">\s*{contact\.call_times[^}]*}\s*</td>)'
contact_body_replacement = '''\\1
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {contact.swing_style || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {contact.current_distance ? `${contact.current_distance}m` : '-'}
                </td>'''

content = re.sub(contact_body_pattern, contact_body_replacement, content, flags=re.DOTALL)

# 수정된 내용 저장
with open('pages/admin-updated.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("✅ 관리자 페이지 업데이트 완료!")