#!/bin/bash

echo "🔧 아이폰 전화 링크 수정 시작..."

# funnel-2025-07-complete.html 파일 수정
FILE="public/versions/funnel-2025-07-complete.html"

if [ -f "$FILE" ]; then
    echo "📝 $FILE 수정 중..."
    
    # 1. 모든 전화번호 링크에서 onclick 이벤트 제거
    sed -i '' 's/onclick="handlePhoneClick(event)"//g' "$FILE"
    sed -i '' 's/onclick="handleFloatingButtonClick(event)"//g' "$FILE"
    
    # 2. JavaScript에서 handlePhoneClick 함수를 완전히 비활성화
    sed -i '' '/function handlePhoneClick/,/^[[:space:]]*}/s/function handlePhoneClick/function OLD_handlePhoneClick/' "$FILE"
    
    # 3. handleFloatingButtonClick 함수도 비활성화
    sed -i '' '/function handleFloatingButtonClick/,/^[[:space:]]*}/s/function handleFloatingButtonClick/function OLD_handleFloatingButtonClick/' "$FILE"
    
    # 4. 간단한 전화 링크 함수로 교체 (모든 기기에서 동일하게 작동)
    cat >> "$FILE" << 'SCRIPT_END'
<script>
// 아이폰 전화 링크 수정 - 모든 onclick 제거
document.addEventListener('DOMContentLoaded', function() {
    // 모든 전화 링크에서 onclick 제거
    const telLinks = document.querySelectorAll('a[href^="tel:"]');
    telLinks.forEach(link => {
        link.removeAttribute('onclick');
        // 클릭 이벤트 리스너 모두 제거
        link.replaceWith(link.cloneNode(true));
    });
    
    console.log('✅ 전화 링크 수정 완료 - 총 ' + telLinks.length + '개');
});
</script>
SCRIPT_END
    
    echo "✅ 수정 완료!"
else
    echo "❌ 파일을 찾을 수 없습니다: $FILE"
fi

echo "
📱 테스트 방법:
1. Git 커밋 & 푸시
2. Vercel 배포 확인
3. 아이폰 Safari에서 테스트
4. 캐시 지우기: 설정 > Safari > 방문 기록 및 웹 사이트 데이터 지우기
"