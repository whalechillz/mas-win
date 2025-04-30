/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // 정적 파일 export 설정
  output: 'export',
  trailingSlash: true,
  // 이미지 최적화 비활성화 (정적 export에 필요)
  images: {
    unoptimized: true,
  },
  // 정적 파일 경로 설정
  basePath: '',
  assetPrefix: '',
  // 리다이렉션 설정
  async redirects() {
    return [
      {
        source: '/',
        destination: '/versions/funnel-2025-05.html',
        permanent: false,
      },
    ];
  },
}

module.exports = nextConfig 