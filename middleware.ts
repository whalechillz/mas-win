// 미들웨어 임시 비활성화 - 무한 리다이렉트 문제 해결
export default function middleware() {
  // 아무것도 하지 않음
}

export const config = {
  matcher: [
    '/admin/:path*'
  ]
}