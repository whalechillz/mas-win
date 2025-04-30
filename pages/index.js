// next.config.js
module.exports = {
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

export default function Home() {
  return <div>리다이렉트 중...</div>;
}