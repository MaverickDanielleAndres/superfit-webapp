import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  output: 'standalone',
  turbopack: {
    root: projectRoot,
  },
  experimental: {
    optimizePackageImports: ["recharts", "framer-motion", "lucide-react", "date-fns"],
  },
  images: {
    formats: ["image/avif", "image/webp"]
  },
  modularizeImports: {
    "lucide-react": {
      transform: "lucide-react/dist/esm/icons/{{kebabCase member}}"
    }
  }
};

export default nextConfig;
