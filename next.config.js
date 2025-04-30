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
}

module.exports = nextConfig 