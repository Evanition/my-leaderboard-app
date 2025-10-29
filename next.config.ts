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
  },
  // --- ADD THIS NEW SECTION ---
  async headers() {
    return [
      {
        // This targets ALL files inside your /public/logos/ folder
        source: '/logos/:all*',
        headers: [
          {
            key: 'Cache-Control',
            // public: allowed to be cached by anyone (browsers, CDNs)
            // max-age=31536000: cache for 1 year (in seconds)
            // immutable: promises the file will NEVER change
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;