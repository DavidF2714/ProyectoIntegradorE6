/** @type {import('next').NextConfig} */
const nextConfig = {
    eslint: {
    ignoreDuringBuilds: true,
    },
    typescript: {
    ignoreBuildErrors: true,
    },
    output: 'export'
}

module.exports = nextConfig
