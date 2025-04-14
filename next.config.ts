// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['localhost', 'jknqsynwantbduipykqx.supabase.co'], // add your Vercel domain here later too
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;
