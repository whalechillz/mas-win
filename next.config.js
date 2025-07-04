/** @type {import('next').NextConfig} */
module.exports = {
    images: {
      unoptimized: true,
    },
    // 빌드에서 백업 디렉토리 제외
    webpack: (config) => {
      config.module.rules.push({
        test: /\.(tsx?|jsx?)$/,
        exclude: /backup-2025-01/,
      });
      return config;
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
    // 커스텀 404 페이지 활성화
    async rewrites() {
      return {
        beforeFiles: [],
        afterFiles: [],
        fallback: []
      }
    }
  };