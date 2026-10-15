/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['@napi-rs/canvas'],
    outputFileTracingIncludes: {
      '/api/generate-ticket': [
        './fonts/**/*',
        './public/ticket-template.png',
        './public/stickers/**/*',
      ],
    },
  },
};

module.exports = nextConfig;
