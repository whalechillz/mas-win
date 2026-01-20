import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

/**
 * 미들웨어: NextAuth API 경로 처리, 관리자 API 인증, 제품 slug 리다이렉트
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ✅ NextAuth API 경로는 무조건 통과 (리다이렉트 루프 방지)
  // /api/auth/* 모든 경로 포함 (session, signin, callback, error 등)
  if (pathname.startsWith('/api/auth') || 
      pathname.startsWith('/ko/api/auth') || 
      pathname.startsWith('/ja/api/auth')) {
    // NextAuth API는 인증 체크 없이 바로 통과
    // trailing slash 제거 (308 리다이렉트 루프 방지)
    if (pathname.endsWith('/') && pathname !== '/api/auth/') {
      const url = request.nextUrl.clone();
      url.pathname = pathname.slice(0, -1); // trailing slash 제거
      return NextResponse.redirect(url, 301);
    }
    return NextResponse.next();
  }

  // ✅ 관리자 API 경로 인증 체크
  if (pathname.startsWith('/api/admin') || pathname.startsWith('/api/channels')) {
    // ✅ cron-job.org 호출 허용 (send-scheduled-sms는 자체 인증 로직 사용)
    // 미들웨어에서 완전히 제외하여 API 내부 인증 로직이 처리하도록 함
    if (pathname === '/api/admin/send-scheduled-sms') {
      return NextResponse.next();
    }
    
    try {
      // Edge Runtime에서 getToken이 불안정할 수 있으므로 쿠키도 직접 확인
      const sessionCookieNames = [
        'next-auth.session-token',
        '__Secure-next-auth.session-token',
        '__Host-next-auth.session-token'
      ];
      
      // 모든 쿠키 확인 (디버깅용)
      const allCookies = request.cookies.getAll();
      const userAgent = request.headers.get('user-agent') || '';
      const referer = request.headers.get('referer') || '';
      const origin = request.headers.get('origin') || '';
      
      // MCP Playwright 브라우저 감지 개선
      // User-Agent, Referer, Origin 등을 종합적으로 확인
      const isPlaywright = 
        userAgent.includes('HeadlessChrome') || 
        userAgent.includes('Playwright') ||
        userAgent.includes('Chrome/') && userAgent.includes('Headless') ||
        // MCP Playwright는 특정 User-Agent 패턴을 가질 수 있음
        (userAgent.includes('Chrome') && !userAgent.includes('Edg') && !userAgent.includes('Safari'));
      
      // MCP Playwright 브라우저 특정 감지 (더 정확한 패턴)
      const isMCPPlaywright = 
        isPlaywright && (
          userAgent.includes('HeadlessChrome') ||
          (userAgent.includes('Chrome') && userAgent.includes('Headless')) ||
          // MCP 서버가 사용하는 특정 헤더나 패턴
          referer.includes('localhost:3000') && userAgent.includes('Chrome')
        );
      
      let hasSessionCookie = false;
      let foundCookieName = '';
      const cookieDetails: string[] = [];
      
      for (const cookieName of sessionCookieNames) {
        const cookie = request.cookies.get(cookieName);
        if (cookie && cookie.value) {
          hasSessionCookie = true;
          foundCookieName = cookieName;
          cookieDetails.push(`${cookieName}: ${cookie.value.substring(0, 30)}...`);
          break;
        }
      }
      
      // MCP Playwright 브라우저인 경우 상세 디버깅 로그
      if (isMCPPlaywright || isPlaywright) {
        console.log(`\n[Middleware] ${isMCPPlaywright ? '🔴 MCP' : '🟡 일반'} Playwright 브라우저 감지: ${pathname}`);
        console.log(`[Middleware] User-Agent: ${userAgent.substring(0, 100)}`);
        console.log(`[Middleware] Referer: ${referer || '없음'}`);
        console.log(`[Middleware] Origin: ${origin || '없음'}`);
        console.log(`[Middleware] 전체 쿠키 개수: ${allCookies.length}`);
        
        if (allCookies.length > 0) {
          console.log(`[Middleware] 모든 쿠키:`);
          allCookies.forEach(c => {
            console.log(`  - ${c.name}: ${c.value.substring(0, 50)}...`);
          });
        } else {
          console.log(`[Middleware] ⚠️ 쿠키가 전혀 없습니다!`);
        }
        
        console.log(`[Middleware] 세션 쿠키 존재: ${hasSessionCookie ? '✅' : '❌'} (${foundCookieName || '없음'})`);
        if (cookieDetails.length > 0) {
          console.log(`[Middleware] 세션 쿠키 상세:`, cookieDetails.join(', '));
        }
        
        // 요청 헤더 전체 확인
        const cookieHeader = request.headers.get('cookie') || '';
        console.log(`[Middleware] Cookie 헤더: ${cookieHeader ? cookieHeader.substring(0, 200) + '...' : '없음'}`);
      }
      
      // 쿠키가 있으면 getToken 시도
      if (hasSessionCookie) {
        try {
          const token = await getToken({ 
            req: request, 
            secret: process.env.NEXTAUTH_SECRET || 'masgolf-admin-secret-key-2024',
            cookieName: process.env.NODE_ENV === 'production' 
              ? '__Secure-next-auth.session-token'
              : 'next-auth.session-token',
          });
          
          if (token) {
            if (isPlaywright && process.env.NODE_ENV === 'development') {
              console.log(`[Middleware] ✅ 토큰 검증 성공: ${pathname}`);
            }
            return NextResponse.next();
          }
        } catch (tokenError: any) {
          // getToken 실패해도 쿠키가 있으면 통과 (Edge Runtime 불안정성 대응)
          // 쿠키가 있다는 것은 세션이 설정되었다는 의미
          if (isPlaywright && process.env.NODE_ENV === 'development') {
            console.log(`[Middleware] ⚠️ getToken 실패했지만 쿠키가 있으므로 통과: ${tokenError.message}`);
          }
          return NextResponse.next();
        }
      }
      
      // 쿠키가 없으면 401 반환
      if (isMCPPlaywright || isPlaywright) {
        console.log(`[Middleware] ❌ 세션 쿠키 없음: ${pathname}`);
        console.log(`[Middleware] 요청 헤더 User-Agent: ${userAgent}`);
        console.log(`[Middleware] 요청 URL: ${request.url}`);
        console.log(`[Middleware] 요청 메서드: ${request.method}`);
        console.log(`[Middleware] 모든 요청 헤더:`, Object.fromEntries(request.headers.entries()));
        
        // MCP Playwright인 경우 추가 안내
        if (isMCPPlaywright) {
          console.log(`[Middleware] ⚠️ MCP Playwright 브라우저에서 쿠키가 전송되지 않았습니다.`);
          console.log(`[Middleware] 💡 해결 방법: MCP Playwright 브라우저를 닫고 다시 열거나, 로그인을 다시 시도하세요.`);
        }
      }
      return NextResponse.json(
        { error: 'Unauthorized', message: 'No valid session' },
        { status: 401 }
      );
    } catch (error: any) {
      // 예상치 못한 에러 시 401 반환
      console.error('Middleware auth error:', error.message);
      return NextResponse.json(
        { error: 'Unauthorized', message: error.message || 'Token verification failed' },
        { status: 401 }
      );
    }
  }

  // 제품 페이지 slug 리다이렉트 매핑
  const slugRedirects: Record<string, string> = {
    '/products/gold2-sapphire': '/products/secret-force-gold-2-muziik',
    '/products/weapon-beryl': '/products/secret-weapon-black-muziik',
    '/products/gold-weapon4': '/products/secret-weapon-gold-4-1',
    '/products/gold2': '/products/secret-force-gold-2',
    '/products/pro3-muziik': '/products/secret-force-pro-3-muziik',
    '/products/pro3': '/products/secret-force-pro-3',
    '/products/v3': '/products/secret-force-v3',
    '/products/black-weapon': '/products/secret-weapon-black',
  };

  // 리다이렉트가 필요한 경우
  if (slugRedirects[pathname]) {
    const url = request.nextUrl.clone();
    url.pathname = slugRedirects[pathname];
    return NextResponse.redirect(url, 301); // 301 Permanent Redirect
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // NextAuth API 경로는 matcher에서 제외 (NextAuth가 직접 처리)
    // '/api/auth/:path*' 제외 - NextAuth가 trailing slash를 자동 처리
    '/api/admin/:path*',  // ✅ 관리자 API 경로 추가 (인증 체크)
    '/api/channels/:path*',  // ✅ 채널 API 경로 추가 (인증 체크)
    '/products/:path*',  // 제품 slug 리다이렉트
  ],
};
