import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const { pathname } = req.nextUrl

        // 관리자 페이지 접근 권한 체크
        if (pathname.startsWith('/admin')) {
          if (!token) {
            // 무한 리다이렉트 방지
            if (pathname !== '/admin/login') {
              return NextResponse.redirect(new URL('/admin/login', req.url))
            }
          }

      // 권한별 접근 제어
      if (pathname.startsWith('/admin/users') && token.role !== 'admin') {
        return NextResponse.redirect(new URL('/admin', req.url))
      }

      if (pathname.startsWith('/admin/system') && token.role !== 'admin') {
        return NextResponse.redirect(new URL('/admin', req.url))
      }
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl

        // 관리자 페이지 접근 권한 체크
        if (pathname.startsWith('/admin')) {
          // 로그인 페이지는 인증 없이 접근 가능
          if (pathname === '/admin/login') {
            return true
          }

          // 인증된 사용자만 접근 가능
          return !!token && (token.role === 'admin' || token.role === 'editor')
        }

        // 다른 페이지는 자유롭게 접근 가능
        return true
      }
    }
  }
)

export const config = {
  matcher: [
    '/admin/:path*'
  ]
}