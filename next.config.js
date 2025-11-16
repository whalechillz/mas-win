/** @type {import('next').NextConfig} */
module.exports = {
  // i18n 설정
  // API 경로는 i18n에서 자동으로 제외됨 (Next.js 기본 동작)
  i18n: {
    locales: ['ko', 'ja'],
    defaultLocale: 'ko',
    localeDetection: true,
  },
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
    domains: [
      'v3.fal.media',
      'oaidalleapiprodscus.blob.core.windows.net',
      'yyytjudftvpmcnppaymw.supabase.co',
      'masgolf.co.kr',
      'static.wixstatic.com',
      'img.youtube.com',
      'images.unsplash.com'
    ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'v3.fal.media',
        port: '',
        pathname: '/files/**',
      },
      {
        protocol: 'https',
        hostname: 'oaidalleapiprodscus.blob.core.windows.net',
        port: '',
        pathname: '/private/**',
      },
      {
        protocol: 'https',
        hostname: 'yyytjudftvpmcnppaymw.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'static.wixstatic.com',
        port: '',
        pathname: '/media/**',
      },
      {
        protocol: 'https',
        hostname: 'img.youtube.com',
        port: '',
        pathname: '/vi/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      }
    ],
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  // Node.js 18 fetch 문제 해결
  experimental: {
    serverMinification: false,
  },
  // 빌드 최적화 설정
  webpack: (config, { isServer, dev }) => {
    // 불필요한 모듈 제거
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    
    // 프로덕션 빌드에서 청크 안정화 (모듈 찾기 에러 방지)
    if (!isServer && !dev) {
      // 기존 optimization이 없으면 기본값 사용
      if (!config.optimization) {
        config.optimization = {};
      }
      
      // 청크 ID 안정화
      config.optimization.moduleIds = 'deterministic';
      config.optimization.chunkIds = 'deterministic';
      
      // splitChunks 설정 (기존 설정 유지하면서 안정화)
      if (!config.optimization.splitChunks) {
        config.optimization.splitChunks = {
          chunks: 'all',
        };
      }
    }
    
    return config;
  },
  
  // 빌드 ID 안정화 (선택사항 - 필요시 주석 해제)
  // generateBuildId: async () => {
  //   return 'build-' + Date.now();
  // },
  // 빌드 성능 최적화
  swcMinify: true,
  // 정적 생성 설정 (Vercel 호환)
  // trailingSlash: true로 인한 웹훅 308 리다이렉트 문제 해결을 위해 false로 변경
  trailingSlash: false,
  // 정적 HTML 내보내기 비활성화 (Vercel 서버리스 함수 사용)
  // output: 'export',
  // 리다이렉트 제거 - 메인 페이지가 index.js를 직접 사용하도록 함
};