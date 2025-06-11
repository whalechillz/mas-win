// next.config.js
/** @type {import('next').NextConfig} */
module.exports = {
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
        // 정적 파일에서 동적 라우트로 리다이렉트
        {
          source: '/versions/funnel-2025-05.html',
          destination: '/funnel-2025-05',
          permanent: true,
        },
        {
          source: '/versions/funnel-2025-06.html',
          destination: '/funnel-2025-06',
          permanent: true,
        },
      ];
    },
  };