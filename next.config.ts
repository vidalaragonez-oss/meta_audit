import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@prisma/client", ".prisma/client"],
  env: {
    PRISMA_CLIENT_ENGINE_TYPE: "binary",
  }
};

export default nextConfig;
