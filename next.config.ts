import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ['192.168.1.3', 'localhost:3000'],
  experimental: {
    optimizePackageImports: ['lucide-react', 'jspdf', 'jspdf-autotable'],
  },
};

export default nextConfig;
