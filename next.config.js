/** @type {import('next').NextConfig} */
const nextConfig = {
    async redirects() {
      return [
        {
          source: '/',
          destination: '/versions/funnel-2025-05.html',
          permanent: false,
        },
      ];
    },
  };

export default nextConfig;