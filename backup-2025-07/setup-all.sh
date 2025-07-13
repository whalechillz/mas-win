#!/bin/bash

# MASGOLF 메인 사이트 통합 설정 스크립트
# 실행: ./setup-all.sh

set -e

echo "
🚀 MASGOLF 메인 사이트 전체 설정 시작
====================================
"

# 실행 권한 부여
chmod +x scripts/*.sh

# 1. 기본 설정
echo "1️⃣ 기본 프로젝트 구조 설정..."
./scripts/setup-main-site.sh

# 2. 컴포넌트 생성
echo "
2️⃣ 컴포넌트 생성..."
./scripts/create-main-components.sh

# 3. Supabase 설정
echo "
3️⃣ Supabase 스키마 준비..."
./scripts/setup-supabase-schema.sh

# 4. 스타일 파일 생성
echo "
4️⃣ 스타일 파일 생성..."
mkdir -p styles/main
cat > styles/main/globals.css << 'EOF'
/* 메인 사이트 전용 스타일 */
@tailwind base;
@tailwind components;
@tailwind utilities;

/* 애니메이션 */
@keyframes fade-in {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

.animate-fade-in {
  animation: fade-in 0.8s ease-out;
}

.animate-fade-in-delay {
  animation: fade-in 0.8s ease-out 0.2s both;
}

.animate-fade-in-delay-2 {
  animation: fade-in 0.8s ease-out 0.4s both;
}

/* 커스텀 스크롤바 */
::-webkit-scrollbar {
  width: 10px;
}

::-webkit-scrollbar-track {
  background: #f1f1f1;
}

::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 5px;
}

::-webkit-scrollbar-thumb:hover {
  background: #555;
}
EOF

# 5. 환경변수 체크
echo "
5️⃣ 환경변수 확인..."
if ! grep -q "NEXT_PUBLIC_MAIN_URL" .env.local; then
    echo "⚠️ 환경변수가 설정되지 않았습니다. .env.local을 확인하세요."
fi

# 완료 메시지
echo "
✅ 설정 완료!
============

📋 다음 단계:

1. 🌐 도메인 설정 (닷네임즈):
   - A 레코드: @ → 76.76.21.21
   - CNAME: www → cname.vercel-dns.com
   
2. 🔧 Vercel 도메인 연결:
   ./scripts/setup-domains.sh
   
3. 🛢️ Supabase 마이그레이션:
   - Supabase 대시보드 > SQL Editor
   - database/migrations/001_create_main_schema.sql 실행
   
4. 🚀 로컬 테스트:
   npm run dev
   http://localhost:3000/main
   
5. 📤 배포:
   git add .
   git commit -m 'Add main website'
   git push
   vercel --prod

📱 테스트 URL:
- 로컬: http://localhost:3000/main
- 프로덕션: https://www.masgolf.co.kr

❓ 문제가 있나요?
- DNS 전파 확인: dig www.masgolf.co.kr
- Vercel 로그 확인: vercel logs
- 미들웨어 디버깅: console.log 추가

Happy coding! 🎉
"
