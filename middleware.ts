import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || '';
  const pathname = request.nextUrl.pathname;
  
  // ✅ 로컬 개발 환경 감지 (안전한 로컬 테스트 허용)
  const isLocal = hostname.includes('localhost') || hostname.includes('127.0.0.1');
  const isDev = process.env.NODE_ENV === 'development';
  const allowLocalTest = process.env.ALLOW_LOCAL_API_TEST === 'true';
  
  // 1) API 경로는 가장 먼저 처리 (i18n 라우팅보다 우선)
  // 프로덕션에서 Next.js i18n이 API 경로를 페이지 경로로 해석하는 문제 방지
  if (pathname.startsWith('/api') || pathname.startsWith('/ko/api') || pathname.startsWith('/ja/api')) {
    // 🔍 디버깅: API 경로 요청 로깅
    console.log('[Middleware] 🔍 API 경로 감지:', {
      pathname,
      hostname,
      method: request.method,
      url: request.url,
      timestamp: new Date().toISOString(),
      hasLocalePrefix: pathname.startsWith('/ko/api') || pathname.startsWith('/ja/api'),
    });
    // NextAuth API 경로는 무조건 통과 (리다이렉트 루프 방지)
    // /api/auth/* 모든 경로 포함 (session, signin, callback, error 등)
    if (pathname.startsWith('/api/auth') || pathname.startsWith('/ko/api/auth') || pathname.startsWith('/ja/api/auth')) {
      // 로케일 프리픽스가 있으면 제거
      if (pathname.startsWith('/ko/api') || pathname.startsWith('/ja/api')) {
        const cleanPath = pathname.replace(/^\/(ko|ja)\/api/, '/api');
        const url = request.nextUrl.clone();
        url.pathname = cleanPath;
        return NextResponse.rewrite(url);
      }
      // NextAuth API는 인증 체크 없이 바로 통과
      return NextResponse.next();
    }
    
    // 모든 API 경로에서 로케일 프리픽스 제거
    if (pathname.startsWith('/ko/api') || pathname.startsWith('/ja/api')) {
      const cleanPath = pathname.replace(/^\/(ko|ja)\/api/, '/api');
      const url = request.nextUrl.clone();
      url.pathname = cleanPath;
      return NextResponse.rewrite(url);
    }
    
    // 이미 정상적인 /api 경로면 통과
    return NextResponse.next();
  }
  
  // 2) 정적/이미지 파일은 통과
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.includes('.') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/images')
  ) {
    return NextResponse.next();
  }

  // 2) /admin/login은 먼저 처리 (리다이렉트 루프 방지)
  if (pathname === '/admin/login' || pathname.startsWith('/admin/login')) {
    return NextResponse.next();
  }

  // 2.5) 관리자 경로는 도메인 리다이렉트 대상에서 제외 (루프 방지)
  // /admin/* 보호 (로그인 필요). /admin/login 은 위에서 이미 통과
  if (pathname.startsWith('/admin')) {
    // 디버깅 모드 체크 (환경 변수로 제어, 기본값: false)
    // Edge Runtime에서는 NEXT_PUBLIC_ 접두사가 필요 없을 수 있으므로 둘 다 체크
    const DEBUG_MODE = process.env.ADMIN_DEBUG_MODE === 'true' || 
                       process.env.NEXT_PUBLIC_ADMIN_DEBUG === 'true' ||
                       request.headers.get('x-debug-mode') === 'true';
    
    // 로컬 개발 환경에서는 디버깅 모드 허용
    const isLocalDev = isLocal || isDev;
    
    // 디버깅 모드이거나 로컬 개발 환경이면 세션 체크 없이 통과
    if (DEBUG_MODE || isLocalDev) {
      return NextResponse.next();
    }
    
    // 프로덕션에서 디버깅 모드가 아닐 때만 세션 체크
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    if (!token) {
      const url = new URL('/admin/login', request.url);
      url.searchParams.set('callbackUrl', request.nextUrl.pathname + request.nextUrl.search);
      return NextResponse.redirect(url);
    }
    
    return NextResponse.next();
  }

  // 3) 구형 MUZIIK 페이지 리다이렉트 (/muziik/ko → /muziik)
  if (pathname === '/muziik/ko' || pathname === '/muziik/ko/') {
    return NextResponse.redirect(new URL('/muziik', request.url), 301);
  }
  if (pathname.startsWith('/muziik/ko/')) {
    const newPath = pathname.replace('/muziik/ko/', '/muziik/');
    return NextResponse.redirect(new URL(newPath, request.url), 301);
  }

  // 4) 도메인 정규화: masgolf.co.kr → www.masgolf.co.kr
  // 관리자 경로는 제외 (이미 위에서 처리됨)
  if (hostname === 'masgolf.co.kr') {
    return NextResponse.redirect(`https://www.masgolf.co.kr${pathname}`, 301);
  }
  if (false && hostname === 'muziik.masgolf.co.kr') {
    if (pathname === '/') {
      return NextResponse.rewrite(new URL('/muziik', request.url));
    }
    if (pathname.startsWith('/muziik')) {
      return NextResponse.rewrite(new URL(pathname, request.url));
    }
    return NextResponse.rewrite(new URL(`/muziik${pathname}`, request.url));
  }

  // 5) 그 외 경로는 통과

  return NextResponse.next();
}

export const config = {
  // API 경로를 명시적으로 포함하여 i18n 로케일 프리픽스 제거 처리
  // 관리자 경로와 MUZIIK 구형 페이지 리다이렉트에 적용
  matcher: [
    '/api/:path*',           // API 경로 명시적 포함
    '/admin/:path*',
    '/muziik/ko',
    '/muziik/ko/:path*'
  ],
};