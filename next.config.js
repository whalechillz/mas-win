// next.config.js
/** @type {import('next').NextConfig} */
module.exports = {
    // output: 'export', // 개발 중에는 주석 처리
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