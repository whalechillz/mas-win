#!/bin/bash
# 아이폰 전화번호 클릭 문제 수정 스크립트

echo "아이폰 전화번호 클릭 문제 수정을 시작합니다..."

# 백업 생성
BACKUP_TIME=$(date +%Y%m%d-%H%M%S)
cp public/versions/funnel-2025-07-complete.html public/versions/funnel-2025-07-complete.html.backup-iphone-fix-$BACKUP_TIME

# Python 스크립트로 복잡한 수정 수행
cat > fix-iphone-tel.py << 'EOF'
import re

# 파일 읽기
with open('public/versions/funnel-2025-07-complete.html', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. 모든 전화번호 링크에서 onclick 이벤트 제거
content = re.sub(r'<a([^>]*href="tel:080-028-8888"[^>]*)\s*onclick="handlePhoneClick\(event\)"([^>]*)>', 
                 r'<a\1\2>', content)
content = re.sub(r'<a([^>]*)\s*onclick="handlePhoneClick\(event\)"([^>]*href="tel:080-028-8888"[^>]*)>', 
                 r'<a\1\2>', content)

# 2. 플로팅 버튼을 div에서 a 태그로 변경
floating_button_pattern = r'<div class="floating-button" onclick="handleFloatingButtonClick\(event\)">(.*?)</div>\s*</a>'
floating_button_replacement = r'<a href="tel:080-028-8888" class="floating-button">\1</a>'
content = re.sub(floating_button_pattern, floating_button_replacement, content, flags=re.DOTALL)

# 다른 패턴도 시도
floating_button_pattern2 = r'<!-- 플로팅 버튼 -->\s*<a[^>]*onclick="handleFloatingButtonClick\(event\)"[^>]*>(.*?)</a>'
floating_button_replacement2 = r'<!-- 플로팅 버튼 -->\n    <a href="tel:080-028-8888" class="floating-button">\1</a>'
content = re.sub(floating_button_pattern2, floating_button_replacement2, content, flags=re.DOTALL)

# 3. 일반적인 플로팅 버튼 패턴
content = content.replace(
    '<a href="tel:080-028-8888" class="floating-button" onclick="handleFloatingButtonClick(event)">',
    '<a href="tel:080-028-8888" class="floating-button">'
)

# 4. handleBookingClick에서 모바일 전화 연결 부분 수정
# window.location.href = 'tel:080-028-8888'; 이 부분은 유지

# 5. CSS에서 a.floating-button 스타일 확인
if 'a.floating-button' not in content and '.floating-button {' in content:
    # .floating-button 스타일에 a 태그 지원 추가
    content = content.replace(
        '.floating-button {',
        'a.floating-button {\n            display: flex;\n            text-decoration: none;\n        }\n        \n        .floating-button {'
    )

# 파일 저장
with open('public/versions/funnel-2025-07-complete.html', 'w', encoding='utf-8') as f:
    f.write(content)

print("수정 완료!")
print("\n수정된 내용:")
print("1. 모든 전화번호 링크에서 onclick 이벤트 제거")
print("2. 플로팅 버튼을 a 태그로 변경")
print("3. CSS 스타일 업데이트")
EOF

# Python 스크립트 실행
python3 fix-iphone-tel.py

# 정리
rm -f fix-iphone-tel.py

echo "아이폰 전화번호 클릭 수정이 완료되었습니다!"
echo "백업 파일: public/versions/funnel-2025-07-complete.html.backup-iphone-fix-$BACKUP_TIME"
