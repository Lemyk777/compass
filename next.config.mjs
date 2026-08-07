// The country profiles' old addresses, kept alive as real 308s.
//
// Duplicated from lib/data/legacy-guide-urls.ts, which this file cannot import
// (next.config is loaded before any TypeScript is compiled). A unit test in
// scripts/test-engine.ts asserts the two lists and the destination registry all
// agree, so adding a twelfth country fails the build's test step until its
// legacy URL is handled too.
//
// Enumerated rather than `/guide/:place`: a pattern here runs BEFORE routing and
// would swallow `/guide/work`, `/guide/cities` and every step name added later,
// sending them to `/guide/places/work` and a 404.
const LEGACY_GUIDE_PLACE_IDS = [
  "united-states",
  "united-kingdom",
  "hong-kong",
  "singapore",
  "germany",
  "italy",
  "netherlands",
  "canada",
  "south-korea",
  "uae",
  "switzerland",
];

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
  async redirects() {
    return LEGACY_GUIDE_PLACE_IDS.map((id) => ({
      source: `/guide/${id}`,
      destination: `/guide/places/${id}`,
      permanent: true,
    }));
  },
};

export default nextConfig;
