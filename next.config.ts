// next.config.js

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'httpshttps',
        hostname: 'cravatar.eu',
        port: '',
        pathname: '/avatar/**',
      },
    ],
  },
  async headers() {
    return [
      {
        // This rule caches your self-hosted logos
        source: '/logos/:all*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        // --- THIS IS THE NEW RULE FOR PLAYER AVATARS ---
        // It targets all images processed by the Next.js Image component
        source: '/_next/image',
        headers: [
          {
            key: 'Cache-Control',
            // This tells browsers (and Vercel's CDN) to cache the
            // unoptimized image for one year.
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;