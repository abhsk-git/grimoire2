import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://127.0.0.1:5051/api/:path*",
      },
      {
        source: "/static/:path*",
        destination: "http://127.0.0.1:5051/static/:path*",
      },
    ];
  },
};

export default nextConfig;
