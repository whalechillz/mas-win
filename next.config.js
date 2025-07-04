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
  // 리다이렉트 제거 - 메인 페이지가 index.js를 직접 사용하도록 함
};