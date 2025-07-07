#!/bin/bash
echo "=== 관리자 페이지 중요요소 데이터 수정 ==="
echo ""

cd /Users/m2/MASLABS/win.masgolf.co.kr

# Python 스크립트로 수정
cat > fix-priority-data.py << 'EOF'
#!/usr/bin/env python3
import re

# admin.tsx 파일 경로
admin_path = "pages/admin.tsx"

# 파일 읽기
with open(admin_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Bookings 테이블에서 스윙타입 다음에 중요요소 데이터 추가
# 현재: 스윙타입 -> 현재거리
# 수정: 스윙타입 -> 중요요소 -> 현재거리

# 패턴 찾기 - booking 테이블의 swing_style 다음 부분
pattern = r'''(<td className="px-6 py-4 text-sm text-gray-900">
                          {booking.swing_style \|\| '-'}
                        </td>)
                        (<td className="px-6 py-4 text-sm text-gray-900">
                          {booking.current_distance \? `\${booking.current_distance}m` : '-'}
                        </td>)'''

replacement = r'''\1
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {booking.priority || '-'}
                        </td>
                        \2'''

content = re.sub(pattern, replacement, content, flags=re.DOTALL)

# Contact 테이블도 확인 - 이미 있는지 체크
contact_pattern = r'contact\.swing_style.*?</td>\s*<td.*?>.*?{contact\.priority'
if not re.search(contact_pattern, content, re.DOTALL):
    # Contact 테이블에도 누락된 경우 추가
    contact_pattern = r'''(<td className="px-6 py-4 text-sm text-gray-900">
                          {contact.swing_style \|\| '-'}
                        </td>)
                        (<td className="px-6 py-4 text-sm text-gray-900">
                          {contact.current_distance \? `\${contact.current_distance}m` : '-'}
                        </td>)'''
    
    contact_replacement = r'''\1
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {contact.priority || '-'}
                        </td>
                        \2'''
    
    content = re.sub(contact_pattern, contact_replacement, content, flags=re.DOTALL)

# 파일 저장
with open(admin_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("✅ 중요요소 데이터 수정 완료!")
print("\n수정 내용:")
print("- Bookings 테이블: 스윙타입 다음에 중요요소 데이터 추가")
print("- Contacts 테이블: 중요요소 데이터 확인 및 추가")
EOF

python3 fix-priority-data.py
rm fix-priority-data.py

echo ""
echo "=== 수정 완료 ==="
echo ""
echo "다음 단계:"
echo "1. 로컬에서 확인: npm run dev"
echo "2. 배포: vercel --prod"
echo ""
echo "이제 관리자 페이지에서:"
echo "- 스윙타입: stability, power, accuracy 등"
echo "- 중요요소: 비거리, 정확도, 일관성 등"
echo "두 가지 모두 표시됩니다!"
