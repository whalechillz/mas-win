#!/bin/bash

echo "🔧 아이폰 전화 링크 완전 수정 시작..."

# funnel-2025-07-complete.html 파일 백업
FILE="public/versions/funnel-2025-07-complete.html"
BACKUP="public/versions/funnel-2025-07-complete.html.backup"

if [ -f "$FILE" ]; then
    echo "📝 백업 생성 중..."
    cp "$FILE" "$BACKUP"
    
    echo "📝 $FILE 수정 중..."
    
    # 1. 모든 전화번호 링크에서 onclick 이벤트 제거
    echo "1️⃣ onclick 이벤트 제거 중..."
    sed -i '' 's/ onclick="handlePhoneClick(event)"//g' "$FILE"
    sed -i '' 's/ onclick="handleFloatingButtonClick(event)"//g' "$FILE"
    
    # 2. 상단 배너의 전화번호 링크 수정
    echo "2️⃣ 상단 배너 전화번호 수정 중..."
    sed -i '' '/<a href="tel:080-028-8888" class="flex items-center hover:text-yellow-100 transition">/s//& /' "$FILE"
    
    # 3. 플로팅 버튼 수정 - onclick 제거
    echo "3️⃣ 플로팅 버튼 수정 중..."
    sed -i '' '/<a href="tel:080-028-8888" class="floating-button"/s/ onclick="[^"]*"//g' "$FILE"
    
    # 4. CTA 버튼 전화 링크 수정
    echo "4️⃣ CTA 버튼 전화 링크 수정 중..."
    sed -i '' 's/<a href="tel:080-028-8888"[^>]*onclick="handlePhoneClick(event)"/<a href="tel:080-028-8888"/g' "$FILE"
    
    # 5. 팝업 내 전화 링크 수정
    echo "5️⃣ 팝업 전화 링크 수정 중..."
    sed -i '' '/<a href="tel:080-028-8888" class="summer-gradient/s/ onclick="[^"]*"//g' "$FILE"
    
    # 6. 푸터 전화 링크 수정
    echo "6️⃣ 푸터 전화 링크 수정 중..."
    sed -i '' '/<a href="tel:080-028-8888" class="hover:text-red-500/s/ onclick="[^"]*"//g' "$FILE"
    
    # 7. JavaScript 함수들을 무효화 (주석 처리)
    echo "7️⃣ JavaScript 함수 무효화 중..."
    # handlePhoneClick 함수를 찾아서 주석 처리
    perl -i -pe 'BEGIN{$/=""} s/function handlePhoneClick\([^)]*\)\s*{[^}]*}/\/\* DISABLED: $& \*\//gs' "$FILE"
    
    # handleFloatingButtonClick 함수를 찾아서 주석 처리
    perl -i -pe 'BEGIN{$/=""} s/function handleFloatingButtonClick\([^)]*\)\s*{[^}]*}/\/\* DISABLED: $& \*\//gs' "$FILE"
    
    echo "✅ 수정 완료!"
    
    # 변경 사항 확인
    echo "
📊 변경 사항 확인:
"
    echo "전화번호 링크 개수:"
    grep -c 'href="tel:080-028-8888"' "$FILE"
    
    echo "
onclick 이벤트 남아있는지 확인:"
    if grep -q 'onclick="handle.*Phone' "$FILE"; then
        echo "⚠️  아직 onclick 이벤트가 남아있습니다!"
        grep 'onclick="handle.*Phone' "$FILE"
    else
        echo "✅ 모든 onclick 이벤트가 제거되었습니다!"
    fi
    
else
    echo "❌ 파일을 찾을 수 없습니다: $FILE"
fi

echo "
📱 다음 단계:
1. Git 커밋 & 푸시
   git add .
   git commit -m 'fix: 아이폰 전화 링크 onclick 이벤트 완전 제거'
   git push

2. Vercel 배포 확인 (자동 배포)

3. 아이폰에서 테스트
   - Safari 캐시 삭제 필수!
   - 설정 > Safari > 방문 기록 및 웹 사이트 데이터 지우기
   
4. 또는 시크릿 모드에서 테스트
"