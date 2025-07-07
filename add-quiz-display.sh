#!/bin/bash

# 퀴즈 데이터 표시 기능 추가 스크립트

echo "🔧 퀴즈 데이터 표시 기능 추가 중..."

# 1. 슬랙 알림 업데이트
echo "1. 슬랙 알림 업데이트..."
if [ -f "pages/api/slack/notify-updated.js" ]; then
    mv pages/api/slack/notify.js pages/api/slack/notify-original.js
    mv pages/api/slack/notify-updated.js pages/api/slack/notify.js
    echo "✅ 슬랙 알림 업데이트 완료"
fi

# 2. 관리자 페이지 퀴즈 데이터 표시 (Python 스크립트로 수정)
echo "2. 관리자 페이지 업데이트..."
cat > update_admin.py << 'EOF'
import re

# admin.tsx 파일 읽기
with open('pages/admin.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 테이블 헤더에 퀴즈 컬럼 추가
# 예약 테이블 헤더 찾기
booking_header_pattern = r'(<th[^>]*>관심클럽</th>)'
booking_header_replacement = r'\1\n            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">스윙타입</th>\n            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">현재거리</th>'

content = re.sub(booking_header_pattern, booking_header_replacement, content)

# 테이블 바디에 퀴즈 데이터 표시
booking_body_pattern = r'(<td[^>]*>{booking\.club[^}]*}</td>)'
booking_body_replacement = r'''\1
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
              {booking.swing_style || '-'}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
              {booking.current_distance ? `${booking.current_distance}m` : '-'}
            </td>'''

content = re.sub(booking_body_pattern, booking_body_replacement, content)

# 문의 테이블도 동일하게 수정
contact_header_pattern = r'(<th[^>]*>통화가능시간</th>)'
contact_header_replacement = r'\1\n            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">스윙타입</th>\n            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">현재거리</th>'

content = re.sub(contact_header_pattern, contact_header_replacement, content)

# 수정된 내용 저장
with open('pages/admin.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("✅ 관리자 페이지 업데이트 완료")
EOF

python3 update_admin.py
rm update_admin.py

# 3. 실시간 확인을 위한 간단한 스크립트
echo "3. 퀴즈 데이터 확인 스크립트 생성..."
cat > check_quiz_data.sql << 'EOF'
-- 퀴즈 데이터가 있는 최근 예약 확인
SELECT 
    name,
    phone,
    date,
    club,
    swing_style,
    priority,
    current_distance,
    recommended_flex,
    expected_distance,
    created_at
FROM bookings
WHERE created_at > NOW() - INTERVAL '7 days'
ORDER BY created_at DESC
LIMIT 10;

-- 퀴즈 데이터 통계
SELECT 
    COUNT(*) as total_bookings,
    COUNT(swing_style) as with_quiz_data,
    COUNT(swing_style)::float / COUNT(*) * 100 as quiz_completion_rate
FROM bookings
WHERE created_at > NOW() - INTERVAL '30 days';
EOF

echo ""
echo "✅ 모든 업데이트 완료!"
echo ""
echo "📌 다음 단계:"
echo "1. 웹사이트에서 퀴즈 완료 후 예약 테스트"
echo "2. check_quiz_data.sql을 Supabase에서 실행하여 데이터 확인"
echo "3. 관리자 페이지에서 퀴즈 데이터 표시 확인"
echo ""
echo "💡 팁: 퀴즈를 하지 않고 바로 예약하면 퀴즈 데이터는 비어있습니다."