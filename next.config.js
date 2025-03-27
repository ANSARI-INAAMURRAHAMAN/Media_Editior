/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['localhost'],
    dangerouslyAllowSVG: true,
    // Since we can't use blob protocol in remotePatterns, 
    // let's unoptimize images for now
    unoptimized: true,
  },
  eslint: {
    // Don't stop the build on ESLint errors in development
    ignoreDuringBuilds: process.env.NODE_ENV !== 'production',
  },
};

module.exports = nextConfig;
