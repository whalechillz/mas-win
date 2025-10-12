import { withAuth } from 'next-auth/middleware'

export default withAuth(
  function middleware(req) {
    // 권한 확인 로직 (필요시 추가)
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token, // 토큰이 있으면 인증된 것으로 간주
    },
    pages: {
      signIn: '/admin/login', // 로그인 페이지 지정
    },
  }
)

export const config = {
  matcher: [
    '/admin/:path*'
  ]
}