import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  // The login form sends users to /protected after signing in.
  async redirects() {
    return [
      { source: "/protected", destination: "/dashboard", permanent: false },
    ];
  },
};

export default nextConfig;
