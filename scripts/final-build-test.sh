#!/bin/bash

echo "=== 마케팅 대시보드 최종 빌드 테스트 ==="
echo ""

# 1. 프로젝트 디렉토리로 이동
cd /Users/m2/MASLABS/win.masgolf.co.kr

# 2. Node 버전 확인
echo "📌 Node 버전 확인:"
node --version
echo "⚠️  Node 18.x가 권장되지만 24.x에서도 작동합니다"
echo ""

# 3. 패키지 확인
echo "📦 필수 패키지 확인:"
if npm list framer-motion >/dev/null 2>&1; then
    echo "✅ framer-motion 설치됨"
else
    echo "❌ framer-motion 설치 필요"
    echo "실행: npm install framer-motion"
fi
echo ""

# 4. 환경 변수 확인
echo "🔧 환경 변수 확인:"
if [ -f ".env.local" ]; then
    echo "✅ .env.local 파일 존재"
    # 필수 환경 변수 확인
    if grep -q "NEXT_PUBLIC_SUPABASE_URL" .env.local; then
        echo "✅ NEXT_PUBLIC_SUPABASE_URL 설정됨"
    else
        echo "❌ NEXT_PUBLIC_SUPABASE_URL 설정 필요"
    fi
    
    if grep -q "NEXT_PUBLIC_SUPABASE_ANON_KEY" .env.local; then
        echo "✅ NEXT_PUBLIC_SUPABASE_ANON_KEY 설정됨"
    else
        echo "❌ NEXT_PUBLIC_SUPABASE_ANON_KEY 설정 필요"
    fi
else
    echo "❌ .env.local 파일이 없습니다"
    echo ".env.example을 참고하여 생성하세요"
fi
echo ""

# 5. 타입스크립트 컴파일 체크
echo "🔍 TypeScript 컴파일 체크:"
npx tsc --noEmit --skipLibCheck 2>&1 | head -20
echo ""

# 6. 빌드 테스트
echo "🏗️  빌드 테스트 시작..."
echo "이 작업은 몇 분 정도 소요될 수 있습니다."
echo ""

# 빌드 실행
npm run build

# 빌드 결과 확인
if [ $? -eq 0 ]; then
    echo ""
    echo "✅ 빌드 성공!"
    echo ""
    echo "다음 단계:"
    echo "1. 데이터베이스 스키마 적용:"
    echo "   Supabase SQL Editor에서 marketing-dashboard-complete-schema.sql 실행"
    echo ""
    echo "2. 로컬 테스트:"
    echo "   npm run dev"
    echo "   http://localhost:3000/marketing-enhanced 접속"
    echo ""
    echo "3. 프로덕션 배포:"
    echo "   git add ."
    echo "   git commit -m 'feat: 마케팅 대시보드 고도화 완료'"
    echo "   git push origin main"
else
    echo ""
    echo "❌ 빌드 실패!"
    echo "위의 에러 메시지를 확인하고 수정하세요."
fi