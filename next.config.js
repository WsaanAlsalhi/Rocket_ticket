/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Keep the native canvas module out of the webpack bundle.
    serverComponentsExternalPackages: ['@napi-rs/canvas'],
    // Make sure the font and template are included in the Vercel function.
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
