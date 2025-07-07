#!/bin/bash

# 즉시 오류 해결을 위한 긴급 패치
# quiz_results 테이블만 사용하고 bookings/contacts에는 기본 정보만 저장

echo "🔧 퀴즈 데이터 오류 긴급 수정 중..."

# 백업 생성
cp public/versions/funnel-2025-07-complete.html public/versions/funnel-2025-07-complete.backup.$(date +%Y%m%d_%H%M%S).html

# funnel-2025-07-complete.html 수정
sed -i '' '
# bookings 저장 부분 수정 - 퀴즈 데이터 제거
/\.from('\''bookings'\'')/,/\.select()/ {
    s/insert\(\[{[^}]*}\]\)/insert([{\
                            name: data.name,\
                            phone: data.phone,\
                            date: data.date,\
                            time: data.time,\
                            club: data.club\
                        }])/
}

# contacts 저장 부분 수정 - 퀴즈 데이터 제거  
/\.from('\''contacts'\'')/,/\.select()/ {
    s/insert\(\[{[^}]*}\]\)/insert([{\
                            name: data.name,\
                            phone: data.phone,\
                            call_times: data.call_times\
                        }])/
}
' public/versions/funnel-2025-07-complete.html

echo "✅ 긴급 수정 완료!"
echo ""
echo "📌 참고사항:"
echo "1. 퀴즈 데이터는 quiz_results 테이블에만 저장됩니다"
echo "2. bookings/contacts 테이블에는 기본 정보만 저장됩니다"
echo "3. Slack 알림에는 퀴즈 데이터가 포함됩니다"
echo ""
echo "💡 영구적 해결을 위해서는:"
echo "1. fix-quiz-data-error.sql을 Supabase에서 실행하거나"
echo "2. 현재 구조를 유지하려면 이 스크립트를 계속 사용하세요"