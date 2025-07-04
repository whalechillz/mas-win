/** @type {import('next').NextConfig} */
module.exports = {
  eslint: {
    // 빌드 시 ESLint 에러 무시 (임시)
    ignoreDuringBuilds: true,
  },
  typescript: {
    // 빌드 시 TypeScript 에러 무시 (임시)
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  async redirects() {
    return [
      {
        source: '/',
        destination: '/funnel-2025-06',
        permanent: false,
      },
    ];
  },
};