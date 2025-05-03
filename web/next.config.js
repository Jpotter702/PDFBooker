/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  // Skip type checking during build
  typescript: {
    // Type checking is still done in development mode
    ignoreBuildErrors: true,
  },
}

module.exports = nextConfig