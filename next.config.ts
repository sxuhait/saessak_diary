import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: {
    // Default bottom-left position overlaps the app's fixed bottom nav.
    position: "top-right",
  },
  experimental: {
    serverActions: {
      // Default 1MB is too small for multi-photo event uploads (up to 5MB
      // each); matches the per-file limit enforced in the upload action and
      // the storage bucket's file_size_limit.
      bodySizeLimit: "20mb",
    },
  },
};

export default nextConfig;
