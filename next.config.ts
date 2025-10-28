import type { NextConfig } from "next";

const nextConfig = {
  reactStrictMode: true,
  images: {
    // MODIFICATION: Added the domain for Minecraft skin avatars
    domains: ['cravatar.eu'],
  },
}

module.exports = nextConfig
