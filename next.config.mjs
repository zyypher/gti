// next.config.mjs

import withPWA from 'next-pwa';

/** @type {import('next').NextConfig} */
const nextConfig = withPWA({
    dest: 'public',
    register: true,
    skipWaiting: true,
    reactStrictMode: true,
});

export default nextConfig;
