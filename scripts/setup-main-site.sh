#!/bin/bash

# MASGOLF 메인 사이트 자동 설정 스크립트
# 실행: ./scripts/setup-main-site.sh

set -e  # 에러 발생시 중단

echo "🚀 MASGOLF 메인 사이트 설정 시작..."

# 1. 디렉토리 구조 생성
echo "📁 디렉토리 구조 생성 중..."
mkdir -p pages/main/{products,about,contact,components}
mkdir -p components/main/{layout,ui,sections}
mkdir -p public/main/{images,assets}
mkdir -p styles/main

# 2. middleware.ts 생성
echo "🔧 미들웨어 설정 중..."
cat > middleware.ts << 'EOF'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || ''
  const pathname = request.nextUrl.pathname
  
  // 정적 파일과 API 라우트는 제외
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/static') ||
    pathname.includes('.')
  ) {
    return NextResponse.next()
  }
  
  // 도메인별 라우팅
  if (hostname.includes('www.masgolf.co.kr') || hostname.includes('masgolf.co.kr')) {
    // www가 없으면 www로 리다이렉트
    if (!hostname.includes('www.')) {
      return NextResponse.redirect(`https://www.masgolf.co.kr${pathname}`)
    }
    return NextResponse.rewrite(new URL(`/main${pathname}`, request.url))
  }
  
  if (hostname.includes('admin.masgolf.co.kr')) {
    return NextResponse.rewrite(new URL(`/admin${pathname}`, request.url))
  }
  
  // win.masgolf.co.kr는 기본 라우트 사용
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
EOF

# 3. 환경변수 업데이트
echo "🔐 환경변수 설정 중..."
cat >> .env.local << 'EOF'

# 도메인 설정
NEXT_PUBLIC_MAIN_URL=https://www.masgolf.co.kr
NEXT_PUBLIC_WIN_URL=https://win.masgolf.co.kr
NEXT_PUBLIC_ADMIN_URL=https://admin.masgolf.co.kr

# 메인 사이트 설정
NEXT_PUBLIC_SITE_NAME="MASGOLF"
NEXT_PUBLIC_SITE_DESCRIPTION="프리미엄 골프 클럽의 새로운 기준"
EOF

# 4. Vercel 설정 업데이트
echo "⚙️ Vercel 설정 업데이트 중..."
cat > vercel.json << 'EOF'
{
  "buildCommand": "next build",
  "devCommand": "next dev",
  "framework": "nextjs",
  "outputDirectory": ".next",
  "rewrites": [
    {
      "source": "/:path*",
      "has": [
        {
          "type": "host",
          "value": "www.masgolf.co.kr"
        }
      ],
      "destination": "/main/:path*"
    }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        }
      ]
    }
  ]
}
EOF

echo "✅ 기본 설정 완료!"
echo "다음 단계: 메인 페이지 생성..."
