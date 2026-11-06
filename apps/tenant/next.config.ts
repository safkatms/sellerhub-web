import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: false,
  allowedDevOrigins: ["192.168.0.104"],
  // Turbopack compiles workspace packages on its own; listing them keeps a `--webpack` build working too.
  transpilePackages: ["@sellerhub/ui", "@sellerhub/api-client"],
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
