// next.config.js
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // We no longer need the 'images' configuration since all images are local.
  // You can remove this section entirely if you want.
  
  images: {unoptimized: true},
  
  async headers() {
    const aMonthInSeconds = '2592000';

    return [
      {
        // Cache your self-hosted logos for one month.
        source: '/logos/:all*',
        headers: [
          {
            key: 'Cache-Control',
            value: `public, max-age=${aMonthInSeconds}, immutable`,
          },
        ],
      },
      {
        // Cache your self-hosted avatars for one month.
        source: '/avatars/:all*',
        headers: [
          {
            key: 'Cache-Control',
            value: `public, max-age=${aMonthInSeconds}, immutable`,
          },
        ],
      },
    ];
  },
};

module.exports = withBundleAnalyzer(nextConfig);
