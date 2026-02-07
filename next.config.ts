import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    "/*": ["./prisma/demo.db", "./prisma/dev.db"],
  },
};

export default nextConfig;
