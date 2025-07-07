#!/bin/bash

# 안전한 관리자 페이지 수정

echo "🔧 관리자 페이지 안전하게 수정 중..."

# 1. 먼저 백업 복원
if [ -f "pages/admin-backup-20250707_150304.tsx" ]; then
    cp pages/admin-backup-20250707_150304.tsx pages/admin.tsx
    echo "✅ 백업 파일 복원 완료"
fi

# 2. Python으로 안전하게 수정
cat > safe_admin_update.py << 'EOF'
import re

# 파일 읽기
with open('pages/admin.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 예약 테이블 헤더에 스윙타입만 추가 (안전하게)
# "관심 클럽" 헤더 다음에 추가
content = content.replace(
    '<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">관심 클럽</th>\n                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">신청 시간</th>',
    '''<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">관심 클럽</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">스윙타입</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">현재거리</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">신청 시간</th>'''
)

# 예약 테이블 바디에 데이터 추가
# booking.club 표시 부분 찾아서 그 다음에 추가
old_booking_cell = '''<td className="px-6 py-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {booking.club || '미정'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {formatDateTime(booking.created_at)}
                        </td>'''

new_booking_cell = '''<td className="px-6 py-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {booking.club || '미정'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {booking.swing_style || '-'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {booking.current_distance ? `${booking.current_distance}m` : '-'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {formatDateTime(booking.created_at)}
                        </td>'''

content = content.replace(old_booking_cell, new_booking_cell)

# 파일 저장
with open('pages/admin.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("✅ 안전하게 수정 완료!")
EOF

python3 safe_admin_update.py
rm safe_admin_update.py

echo ""
echo "✅ 수정 완료!"
echo "📌 Next.js 서버를 재시작해주세요:"
echo "   1. Ctrl+C로 중지"
echo "   2. npm run dev 실행"