// next.config.js

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cravatar.eu',
        port: '',
        pathname: '/avatar/**',
      },
    ],
    unoptimized: true,
  },
  
  async headers() {
    return [
      {
        // This rule is for your self-hosted logos. 'immutable' is SAFE here
        // because you control these files. They won't change unless you deploy.
        source: '/logos/:all*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        // --- THIS IS THE NEW, SMARTER RULE FOR PLAYER AVATARS ---
        source: '/_next/image',
        headers: [
          {
            key: 'Cache-Control',
            // This is a production-grade caching header for proxied content.
            // s-maxage=86400: The CDN (Vercel) will cache the image for 1 day.
            // stale-while-revalidate=31536000: If a request comes after 1 day,
            // the CDN will serve the old (stale) image immediately, and then
            // re-fetch the fresh one in the background for the next user.
            value: 'public, s-maxage=86400, stale-while-revalidate=31536000',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;