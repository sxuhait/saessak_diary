import type { NextConfig } from "next";

const supabaseHostname = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : undefined;

const nextConfig: NextConfig = {
  devIndicators: {
    // Default bottom-left position overlaps the app's fixed bottom nav.
    position: "top-right",
  },
  images: {
    // Lets next/image optimize/resize event photos served from the
    // public event-photos Storage bucket instead of shipping originals.
    remotePatterns: supabaseHostname
      ? [
          {
            protocol: "https",
            hostname: supabaseHostname,
            pathname: "/storage/v1/object/public/event-photos/**",
          },
        ]
      : [],
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
