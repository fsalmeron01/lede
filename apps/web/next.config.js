/** @type {import('next').NextConfig} */
const nextConfig = {
  // Show full error details during build
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },
};

module.exports = nextConfig;
