#!/bin/bash

echo "🔍 Next.js 라우팅 문제 진단"
echo "============================"

# 1. 정적 HTML 파일 확인
echo ""
echo "1️⃣ 정적 HTML 파일 확인:"
echo "------------------------"
if [ -f "public/index.html" ] || [ -f "public/404.html" ]; then
    echo "⚠️  문제 발견: public 폴더에 정적 HTML 파일이 있습니다."
    [ -f "public/index.html" ] && echo "   - public/index.html"
    [ -f "public/404.html" ] && echo "   - public/404.html"
else
    echo "✅ 정적 HTML 파일 없음 (정상)"
fi

# 2. Next.js 페이지 확인
echo ""
echo "2️⃣ Next.js 페이지 구조:"
echo "---------------------"
echo "📄 정적 페이지:"
find pages -maxdepth 1 -name "*.js" -o -name "*.jsx" -o -name "*.ts" -o -name "*.tsx" | grep -v "_" | sort

echo ""
echo "📁 동적 라우트:"
find pages -type d -mindepth 1 | grep -v "api" | sort

# 3. API 라우트 확인
echo ""
echo "3️⃣ API 엔드포인트:"
echo "-----------------"
find pages/api -name "*.js" -o -name "*.ts" | sort

# 4. 빌드 출력 확인
echo ""
echo "4️⃣ 빌드 아티팩트 확인:"
echo "--------------------"
if [ -d ".next" ]; then
    echo "✅ .next 폴더 존재"
    echo "   최종 수정: $(date -r .next)"
else
    echo "❌ .next 폴더 없음 - 빌드 필요"
fi

# 5. 환경변수 확인
echo ""
echo "5️⃣ 환경변수 설정:"
echo "----------------"
if [ -f ".env.local" ]; then
    echo "✅ .env.local 파일 존재"
    grep -E "^[A-Z]" .env.local | sed 's/=.*/=***/' | sort
else
    echo "❌ .env.local 파일 없음"
fi

# 6. Vercel 설정 확인
echo ""
echo "6️⃣ Vercel 설정:"
echo "--------------"
if [ -f "vercel.json" ]; then
    echo "✅ vercel.json 존재"
    cat vercel.json | grep -E "(rewrites|redirects|headers)" | head -5
else
    echo "📝 vercel.json 없음 (기본 설정 사용)"
fi

# 7. 해결 방법 제안
echo ""
echo "🔧 권장 해결 방법:"
echo "=================="
echo "1. Vercel 대시보드에서 프로젝트 재배포:"
echo "   vercel --prod"
echo ""
echo "2. 로컬에서 빌드 테스트:"
echo "   npm run build && npm start"
echo ""
echo "3. Vercel 로그 확인:"
echo "   vercel logs --prod"

echo ""
echo "✅ 진단 완료!"
