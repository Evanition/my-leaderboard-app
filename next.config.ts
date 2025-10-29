// next.config.js

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Re-enable the default image loader with remotePatterns
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cravatar.eu',
        port: '',
        pathname: '/avatar/**',
      },
    ],
  },
  
  // Configure caching for both logos and the proxied avatars
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
        // This rule caches the images processed by Next.js, including the
        // unoptimized avatars from cravatar.eu
        source: '/_next/image',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;