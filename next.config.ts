// next.config.js

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    // --- THIS SECTION GLOBALLY UNOPTIMIZES ALL IMAGES ---
    // We define a custom loader that just returns the original image URL.
    // This effectively disables the Next.js image optimization pipeline.
    loader: 'custom',
    loaderFile: './image-loader.js',
  },
  
  // This section adds the caching headers to the files.
  async headers() {
    return [
      {
        // This rule caches your self-hosted logos.
        source: '/logos/:all*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      // NOTE: We no longer need a rule for /_next/image because the
      // custom loader will prevent that route from being used.
      // The browser will now request the images from their original URLs.
    ];
  },
};

module.exports = nextConfig;