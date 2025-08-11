#!/bin/bash

# 관리자 페이지에 퀴즈 데이터 표시 추가
echo "🔧 관리자 페이지 업데이트 중..."

# 백업 생성
cp pages/admin.tsx pages/admin-backup-$(date +%Y%m%d_%H%M%S).tsx

# 예약 테이블 헤더에 퀴즈 컬럼 추가
sed -i '' '/<th.*관심 클럽.*<\/th>/a\
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">스윙타입</th>\
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">현재거리</th>\
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">추천플렉스</th>
' pages/admin.tsx

# 예약 테이블 바디에 퀴즈 데이터 추가
sed -i '' '/{booking.club || '\''미정'\''}/,/<\/td>/{
    /<\/td>/a\
                        <td className="px-6 py-4 text-sm text-gray-900">\
                          {booking.swing_style || '\''-'\''}\
                        </td>\
                        <td className="px-6 py-4 text-sm text-gray-900">\
                          {booking.current_distance ? `${booking.current_distance}m` : '\''-'\''}\
                        </td>\
                        <td className="px-6 py-4 text-sm text-gray-900">\
                          {booking.recommended_flex || '\''-'\''}\
                        </td>
}' pages/admin.tsx

# 문의 테이블 헤더에 퀴즈 컬럼 추가
sed -i '' '/<th.*통화 가능 시간.*<\/th>/a\
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">스윙타입</th>\
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">현재거리</th>
' pages/admin.tsx

# 문의 테이블 바디에 퀴즈 데이터 추가
sed -i '' '/{contact.call_times || '\''시간무관'\''}/,/<\/td>/{
    /<\/td>/a\
                        <td className="px-6 py-4 text-sm text-gray-900">\
                          {contact.swing_style || '\''-'\''}\
                        </td>\
                        <td className="px-6 py-4 text-sm text-gray-900">\
                          {contact.current_distance ? `${contact.current_distance}m` : '\''-'\''}\
                        </td>
}' pages/admin.tsx

echo "✅ 관리자 페이지 업데이트 완료!"
echo ""
echo "📌 다음 단계:"
echo "1. Next.js 서버 재시작 (개발: Ctrl+C 후 npm run dev)"
echo "2. 관리자 페이지 새로고침"
echo "3. 예약/문의 테이블에서 스윙타입, 현재거리, 추천플렉스 확인"