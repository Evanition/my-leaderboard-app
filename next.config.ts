// next.config.js

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cravatar.eu', // Or 'mc-heads.net' if you switched
        port: '',
        pathname: '/avatar/**',
      },
      // If you switched to mc-heads.net, the pattern would be:
      // {
      //   protocol: 'https',
      //   hostname: 'mc-heads.net',
      //   port: '',
      //   pathname: '/avatar/**',
      // }
    ],
    unoptimized: true
  },
  
  async headers() {
    // 2592000 seconds = 30 days
    const aMonthInSeconds = '2592000';

    return [
      {
        // This rule caches your self-hosted logos for one month.
        source: '/logos/:all*',
        headers: [
          {
            key: 'Cache-Control',
            value: `public, max-age=${aMonthInSeconds}, immutable`,
          },
        ],
      },
      {
        // This rule caches the proxied player avatars for one month.
        source: '/_next/image',
        headers: [
          {
            key: 'Cache-Control',
            // s-maxage tells the CDN (Vercel) to cache for 1 month.
            // stale-while-revalidate ensures the site stays fast even when refreshing cache.
            value: `public, s-maxage=${aMonthInSeconds}, stale-while-revalidate=31536000`,
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;