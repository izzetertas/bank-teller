import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // The app is fully client-side, so it ships as a static export (out/),
  // deployable to any static host (e.g. Cloudflare Pages).
  output: 'export',
};

export default nextConfig;
