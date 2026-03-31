/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Standalone 빌드는 Vercel 배포 시 안정성을 높여줍니다.
  output: "standalone",
};

module.exports = nextConfig;
