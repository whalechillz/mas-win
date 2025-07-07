#!/bin/bash

# 퀴즈 데이터 오류 수정 스크립트
# bookings/contacts 테이블에서 퀴즈 데이터를 제거하고 quiz_results 테이블만 사용

echo "🔧 퀴즈 데이터 오류 수정 중..."

# 백업 생성
BACKUP_FILE="public/versions/funnel-2025-07-complete.backup.$(date +%Y%m%d_%H%M%S).html"
cp public/versions/funnel-2025-07-complete.html "$BACKUP_FILE"
echo "✅ 백업 생성: $BACKUP_FILE"

# Python 스크립트로 정확한 수정
cat > fix_quiz_error.py << 'EOF'
import re

# HTML 파일 읽기
with open('public/versions/funnel-2025-07-complete.html', 'r', encoding='utf-8') as f:
    content = f.read()

# bookings 저장 부분 수정
# 원본 패턴
booking_pattern = r"const { data: bookingResult, error: bookingError } = await supabase\s*\.from\('bookings'\)\s*\.insert\(\[\{[^}]+\}\]\)"

# 새로운 코드
booking_replacement = """const { data: bookingResult, error: bookingError } = await supabase
                        .from('bookings')
                        .insert([{
                            name: data.name,
                            phone: data.phone,
                            date: data.date,
                            time: data.time,
                            club: data.club
                        }])"""

content = re.sub(booking_pattern, booking_replacement, content, flags=re.DOTALL)

# contacts 저장 부분 수정
# 원본 패턴 
contact_pattern = r"const { data: contactResult, error } = await supabase\s*\.from\('contacts'\)\s*\.insert\(\[\{[^}]+\}\]\)"

# 새로운 코드
contact_replacement = """const { data: contactResult, error } = await supabase
                        .from('contacts')
                        .insert([{
                            name: data.name,
                            phone: data.phone,
                            call_times: data.call_times
                        }])"""

content = re.sub(contact_pattern, contact_replacement, content, flags=re.DOTALL)

# 수정된 내용 저장
with open('public/versions/funnel-2025-07-complete.html', 'w', encoding='utf-8') as f:
    f.write(content)

print("✅ 수정 완료!")
EOF

# Python 스크립트 실행
python3 fix_quiz_error.py

# 임시 파일 삭제
rm fix_quiz_error.py

echo ""
echo "✅ 퀴즈 데이터 오류 수정 완료!"
echo ""
echo "📌 변경사항:"
echo "- bookings 테이블: 기본 예약 정보만 저장"
echo "- contacts 테이블: 기본 문의 정보만 저장"
echo "- quiz_results 테이블: 퀴즈 데이터 저장"
echo "- Slack 알림: 모든 데이터 포함"
echo ""
echo "🔄 원본으로 복구하려면:"
echo "cp $BACKUP_FILE public/versions/funnel-2025-07-complete.html"