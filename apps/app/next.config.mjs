import path from "node:path";
import { fileURLToPath } from "node:url";
import { config as loadEnv } from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Later files override earlier (app-local wins over monorepo root).
loadEnv({ path: path.resolve(__dirname, "../../.env") });
loadEnv({ path: path.resolve(__dirname, "../../.env.local"), override: true });
loadEnv({ path: path.resolve(__dirname, ".env"), override: true });
loadEnv({ path: path.resolve(__dirname, ".env.local"), override: true });

/** @type {import("next").NextConfig} */
const nextConfig = {
  output: "standalone",
  outputFileTracingRoot: path.join(__dirname, "../.."),
  transpilePackages: [
    "@t3-oss/env-nextjs",
    "@t3-oss/env-core",
    "@workspace/ui",
  ],
};

export default nextConfig;
