import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: {
    // Default bottom-left position overlaps the app's fixed bottom nav.
    position: "top-right",
  },
};

export default nextConfig;
