import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/lib/i18n/server.ts");

const nextConfig: NextConfig = {
  /* config options here */
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
  // Explicitly disable locale-based routing
  // All routes should be without locale prefixes (e.g., /app not /ko/app)
  experimental: {
    // Ensure no locale routing is enabled
  },
};

export default withNextIntl(nextConfig);
