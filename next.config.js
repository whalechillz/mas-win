/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  trailingSlash: true,
  async rewrites() {
    return [
      {
        source: '/',
        destination: '/masgolf-may-funnel.html',
      },
      {
        source: '/:path*',
        destination: '/:path*',
      }
    ];
  },
  // 정적 파일 export 설정 추가
  output: 'export',
  // 이미지 최적화 비활성화 (정적 export에 필요)
  images: {
    unoptimized: true,
  },
}

module.exports = nextConfig 