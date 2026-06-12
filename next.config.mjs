/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [{ protocol: 'https', hostname: '**' }],
  },
  typescript: {
    // Erros de tipo não bloqueiam o build em produção
    ignoreBuildErrors: true,
  },
  eslint: {
    // Warnings/erros de ESLint não bloqueiam o build
    ignoreDuringBuilds: true,
  },
}

module.exports = nextConfig