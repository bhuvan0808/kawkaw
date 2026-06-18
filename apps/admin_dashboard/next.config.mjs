/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Consume the workspace TS package directly (it ships compiled dist, but
  // transpiling keeps it working even if only src is present).
  transpilePackages: ['@kawkaw/shared-types'],
  eslint: {
    // Lint is run explicitly in CI; don't fail production builds on style.
    ignoreDuringBuilds: true,
  },
  images: {
    // Product / category images are remote URLs managed by admins.
    remotePatterns: [{ protocol: 'https', hostname: '**' }],
  },
};

export default nextConfig;
