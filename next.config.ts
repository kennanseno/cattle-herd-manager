import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // googleapis uses dynamic requires; keep it external from the server bundle.
  serverExternalPackages: ["googleapis"],
};

export default nextConfig;
