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
  if (hostname === 'masgolf.co.kr') {
    // www가 없으면 www로 리다이렉트
    return NextResponse.redirect(`https://www.masgolf.co.kr${pathname}`)
  }
  
  // muziik.masgolf.co.kr 도메인 라우팅
  if (hostname === 'muziik.masgolf.co.kr') {
    return NextResponse.rewrite(new URL(`/muziik${pathname}`, request.url))
  }
  
  // 모든 도메인은 기본 라우트 사용 (pages/index.js)
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