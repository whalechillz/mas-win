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
  // 정적 생성 설정 (Vercel 호환)
  trailingSlash: true,
  // 정적 HTML 내보내기 비활성화 (Vercel 서버리스 함수 사용)
  // output: 'export',
  // 리다이렉트 제거 - 메인 페이지가 index.js를 직접 사용하도록 함
};