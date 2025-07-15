#!/bin/bash
# Vercel 환경 변수 설정 확인 스크립트

echo "🔍 Vercel 환경 변수 확인 중..."

# Vercel CLI 설치 확인
if ! command -v vercel &> /dev/null; then
    echo "Vercel CLI 설치 필요: npm i -g vercel"
    exit 1
fi

echo ""
echo "📋 필수 환경 변수 목록:"
echo "======================="
echo "SUPABASE_SERVICE_KEY"
echo "NEXT_PUBLIC_SUPABASE_URL" 
echo "NEXT_PUBLIC_SUPABASE_ANON_KEY"
echo ""

echo "🔧 Vercel에 환경 변수 추가 방법:"
echo "================================"
echo "1. https://vercel.com 접속"
echo "2. win.masgolf.co.kr 프로젝트 선택"
echo "3. Settings → Environment Variables"
echo "4. 다음 변수 추가:"
echo ""
echo "Variable: SUPABASE_SERVICE_KEY"
echo "Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl5eXRqdWRmdHJ2cG1jbnBwYXltdyIsInJvbGUiOiJzZXJ2aWNlX3JvbGUiLCJpYXQiOjE3NTE0NDcxMTksImV4cCI6MjA2NzAyMzExOX0.1X23B7AANAg_g2Q1AAYl_kIHdd_OQap8YxElvvJn1io"
echo "Environment: Production, Preview, Development 모두 체크"
echo ""

# 로컬에서 테스트
echo "📝 로컬 테스트 API 생성..."
cat > test-env.js << 'EOF'
// 환경 변수 테스트
const hasServiceKey = !!process.env.SUPABASE_SERVICE_KEY;
console.log('SUPABASE_SERVICE_KEY 설정됨:', hasServiceKey);
console.log('키 길이:', process.env.SUPABASE_SERVICE_KEY?.length || 0);
EOF

node test-env.js
rm test-env.js