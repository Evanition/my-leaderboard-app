// next.config.js

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Use the 'images' key to configure Next.js Image Optimization.
  images: {
    // 'remotePatterns' is an array of objects that define allowed external image sources.
    remotePatterns: [
      {
        // This pattern specifically targets the cravatar.eu service.
        protocol: 'https',
        hostname: 'cravatar.eu',
        port: '', // The port is usually empty for standard https.
        pathname: '/avatar/**', // This is the key part.
      },
    ],
  },
};

module.exports = nextConfig;