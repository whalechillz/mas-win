#!/bin/bash
echo "=== 관리자 페이지 중요요소 컬럼 추가 ==="
echo ""

cd /Users/m2/MASLABS/win.masgolf.co.kr

# 백업 생성
cp pages/admin.tsx pages/admin.tsx.backup-$(date +%Y%m%d-%H%M%S)
echo "✓ 백업 생성 완료"

# Python 스크립트로 수정
cat > add-priority-column.py << 'EOF'
#!/usr/bin/env python3

# admin.tsx 파일 읽기
with open('pages/admin.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# 수정된 라인들을 저장할 리스트
new_lines = []
i = 0

while i < len(lines):
    line = lines[i]
    
    # Bookings 테이블 헤더 찾기
    if '<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">스윙타입</th>' in line:
        new_lines.append(line)
        # 중요요소 헤더 추가
        new_lines.append('                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">중요요소</th>\n')
        print("✓ Bookings 테이블 헤더에 중요요소 추가")
    
    # Bookings 테이블 데이터 찾기
    elif '{booking.swing_style || \'-\'}' in line and '<td className="px-6 py-4 text-sm text-gray-900">' in line:
        new_lines.append(line)
        # 다음 </td> 찾기
        i += 1
        while i < len(lines) and '</td>' not in lines[i]:
            new_lines.append(lines[i])
            i += 1
        if i < len(lines):
            new_lines.append(lines[i])  # </td> 추가
        # 중요요소 데이터 추가
        new_lines.append('                        <td className="px-6 py-4 text-sm text-gray-900">\n')
        new_lines.append('                          {booking.priority || \'-\'}\n')
        new_lines.append('                        </td>\n')
        print("✓ Bookings 테이블 데이터에 중요요소 추가")
    
    # Contacts 테이블 데이터 찾기
    elif '{contact.swing_style || \'-\'}' in line and '<td className="px-6 py-4 text-sm text-gray-900">' in line:
        new_lines.append(line)
        # 다음 </td> 찾기
        i += 1
        while i < len(lines) and '</td>' not in lines[i]:
            new_lines.append(lines[i])
            i += 1
        if i < len(lines):
            new_lines.append(lines[i])  # </td> 추가
        # 중요요소 데이터 추가
        new_lines.append('                        <td className="px-6 py-4 text-sm text-gray-900">\n')
        new_lines.append('                          {contact.priority || \'-\'}\n')
        new_lines.append('                        </td>\n')
        print("✓ Contacts 테이블 데이터에 중요요소 추가")
    
    else:
        new_lines.append(line)
    
    i += 1

# 파일 다시 쓰기
with open('pages/admin.tsx', 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

print("\n✅ 중요요소 컬럼 추가 완료!")
EOF

python3 add-priority-column.py
rm add-priority-column.py

echo ""
echo "=== 수정 완료 ==="
echo ""
echo "추가된 내용:"
echo "- 시타 예약 테이블: 스윙타입 옆에 '중요요소' 컬럼"
echo "- 문의 관리 테이블: 스윙타입 옆에 '중요요소' 컬럼"
echo ""
echo "테스트 방법:"
echo "1. npm run dev (로컬 테스트)"
echo "2. http://localhost:3000/admin 접속"
echo "3. 중요요소 컬럼 확인"
echo ""
echo "배포: vercel --prod"
