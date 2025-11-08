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
  
  // 1) 정적/이미지/API는 통과
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/static') ||
    pathname.includes('.') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/images')
  ) {
    // ✅ 로컬 테스트 환경에서는 API 경로 통과 (프로덕션에서는 기존 로직 유지)
    // 주의: ALLOW_LOCAL_API_TEST=true가 설정되어 있어야만 로컬에서 테스트 가능
    if (pathname.startsWith('/api') && isLocal && isDev && allowLocalTest) {
      // 로컬 개발 환경에서 API 테스트 허용
      console.log('[Middleware] 로컬 API 테스트 허용:', pathname);
    }
    return NextResponse.next();
  }

  // 2) /admin/login은 먼저 처리 (리다이렉트 루프 방지)
  if (pathname === '/admin/login' || pathname.startsWith('/admin/login')) {
    return NextResponse.next();
  }

  // 2.5) 관리자 경로는 도메인 리다이렉트 대상에서 제외 (루프 방지)
  // /admin/* 보호 (로그인 필요). /admin/login 은 위에서 이미 통과
  if (pathname.startsWith('/admin')) {
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

  // 4) (임시) 도메인 리다이렉트 비활성화 - 루프 원인 제거
  // 필요 시 도메인 정규화는 Vercel Redirects 설정으로만 처리
  if (false && hostname === 'masgolf.co.kr') {
    return NextResponse.redirect(`https://www.masgolf.co.kr${pathname}`);
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
  // 관리자 경로와 MUZIIK 구형 페이지 리다이렉트에 적용
  matcher: ['/admin/:path*', '/muziik/ko', '/muziik/ko/:path*'],
};