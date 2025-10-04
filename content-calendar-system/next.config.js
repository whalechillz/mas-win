module.exports = {
  reactStrictMode: true,
  swcMinify: true,
  
  // 이미지 최적화 설정
  images: {
    domains: ['massgoo.com', 'fal.ai', 'api.openai.com'],
    formats: ['image/avif', 'image/webp'],
  },

  // 환경 변수
  env: {
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_BASE_URL,
  },

  // 리다이렉트
  async redirects() {
    return [
      {
        source: '/admin',
        destination: '/admin/content-calendar',
        permanent: false,
      },
    ];
  },

  // 헤더 설정
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,OPTIONS,PATCH,DELETE,POST,PUT' },
          { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version' },
        ],
      },
    ];
  },

  // Webpack 설정
  webpack: (config, { isServer }) => {
    // 차트 라이브러리 최적화
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    return config;
  },
};
