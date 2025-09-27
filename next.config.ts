import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: ['res.cloudinary.com'],
  },
  transpilePackages: ['antd'],
};

export default nextConfig;
