import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    // Explicitly set the workspace root to the frontend directory to avoid
    // lockfile root inference issues in monorepos
    root: __dirname,
  },
};

export default nextConfig;
