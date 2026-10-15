/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingIncludes: {
    '/api/generate-ticket': ['./fonts/**/*'],
    '/api/upload-ticket': ['./fonts/**/*'],
  },
};

module.exports = nextConfig;
