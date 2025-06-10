// next.config.js
/** @type {import('next').NextConfig} */
module.exports = {
    async redirects() {
      return [
        {
          source: '/',
          destination: '/funnel-2025-06',
          permanent: false,
        },
        {
          source: '/versions/funnel-2025-06',
          destination: '/versions/funnel-2025-06.html',
          permanent: true,
        },
      ];
    },
  };