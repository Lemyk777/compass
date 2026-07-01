/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Tree-shake barrel imports of heavy libs so only the pieces we actually use
  // ship. Build-time only — zero runtime/visual change.
  experimental: {
    optimizePackageImports: [
      "recharts",
      "framer-motion",
      "lucide-react",
      "d3-geo",
    ],
  },
};

export default nextConfig;
