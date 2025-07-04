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
    // 정적 파일 서빙 설정 추가
    async headers() {
      return [
        {
          source: '/:all*(html|css|js)',
          headers: [
            {
              key: 'Cache-Control',
              value: 'public, max-age=3600',
            },
          ],
        },
      ];
    },
  };