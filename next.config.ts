import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    optimizePackageImports: ["recharts", "framer-motion", "lucide-react", "date-fns"]
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
