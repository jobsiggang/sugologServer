import type { NextConfig } from "next";
import withPWA from "@ducanh2912/next-pwa";


const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true,
  },
  // Turbopack explicit config for Next.js 16+
  turbopack: {},
};

export default withPWA({
  dest: "public",
  disable: true, // PWA 완전 비활성화 (아이콘 준비 전까지)
  register: true,
  cacheOnFrontEndNav: true,
  reloadOnOnline: true,
  fallbacks: {
    document: "/login",
  },
})(nextConfig);
