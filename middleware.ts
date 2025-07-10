import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // /admin 경로 체크
  if (request.nextUrl.pathname.startsWith('/admin')) {
    // admin-login 페이지는 제외
    if (request.nextUrl.pathname === '/admin-login') {
      return NextResponse.next();
    }
    
    // 쿠키에서 인증 정보 확인
    const auth = request.cookies.get('admin_auth');
    
    // 인증되지 않은 경우 로그인 페이지로 리다이렉트
    if (!auth || auth.value !== '1') {
      const loginUrl = new URL('/admin-login', request.url);
      return NextResponse.redirect(loginUrl);
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: '/admin/:path*'
};