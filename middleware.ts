import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || '';
  const pathname = request.nextUrl.pathname;

  // 1) 정적/이미지/API는 통과
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/static') ||
    pathname.includes('.') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/images')
  ) {
    return NextResponse.next();
  }

  // 2) 도메인 라우팅 처리
  if (hostname === 'masgolf.co.kr') {
    return NextResponse.redirect(`https://www.masgolf.co.kr${pathname}`);
  }
  if (hostname === 'muziik.masgolf.co.kr') {
    if (pathname === '/') {
      return NextResponse.rewrite(new URL('/muziik', request.url));
    }
    if (pathname.startsWith('/muziik')) {
      return NextResponse.rewrite(new URL(pathname, request.url));
    }
    return NextResponse.rewrite(new URL(`/muziik${pathname}`, request.url));
  }

  // 3) /admin/* 보호 (로그인 필요). /admin/login 은 예외
  if (pathname.startsWith('/admin') && !pathname.startsWith('/admin/login')) {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    if (!token) {
      const url = new URL('/admin/login', request.url);
      url.searchParams.set('callbackUrl', request.nextUrl.pathname + request.nextUrl.search);
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};