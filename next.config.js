/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
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