// next.config.js
/** @type {import('next').NextConfig} */
module.exports = {
    // output: 'export', // 동적 라우팅을 위해 주석 처리
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
        // 정적 파일 리다이렉트 제거 - HTML 파일 직접 접근 허용
        // 5월, 6월 퍼널 페이지는 /versions/ 경로로 직접 접근
      ];
    },
  };