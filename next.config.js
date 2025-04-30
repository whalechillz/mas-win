/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: '/versions/:path*',
        destination: '/versions/:path*',
      },
    ];
  },
  async redirects() {
    return [
      {
        source: '/',
        destination: '/masgolf-may-funnel.html',
        permanent: false,
      },
    ];
  },
}

module.exports = nextConfig 