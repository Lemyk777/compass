// The short address of every country profile, `/guide/<country>`, as a real 308.
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
  "kazakhstan",
  "georgia",
  "poland",
  "turkiye",
  "china",
  "japan",
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

// Renamed city hubs, old id → new id. Duplicated from
// lib/data/legacy-guide-urls.ts (RENAMED_HUB_IDS) — same reason as above, this
// file is loaded before any TypeScript is compiled — and asserted equal by a
// unit test. A hub id is a public URL that was already in the sitemap.
const RENAMED_HUB_IDS = {
  "osaka-kyoto": "osaka",
};

// The planner's old routes, and the `?view=` value each becomes. Duplicated
// from lib/data/planner-sections.ts for the same reason as the lists above —
// next.config is loaded before any TypeScript is compiled — and asserted equal
// by a unit test, so renaming a view without handling its old address fails the
// build's test step.
const PLANNER_VIEW_REDIRECTS = [
  ["/planner/board", "board"],
  ["/planner/maps", "map"],
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Tree-shake barrel imports of heavy libs so only the pieces we actually use
  // ship. Build-time only — zero runtime/visual change.
  // Only packages this repo actually imports. `lucide-react` and `d3-geo` were
  // listed here after both stopped being dependencies — Next ignores an entry
  // for a package it cannot resolve, so the staleness was silent.
  experimental: {
    optimizePackageImports: ["recharts", "framer-motion"],
  },

  /**
   * Response headers. There were none, which is not a neutral default.
   *
   * The one that matters most here is framing: without it any site can put our
   * sign-in page in an invisible iframe and collect what a student types into
   * it. SAMEORIGIN rather than DENY on purpose — DENY would also break Vercel's
   * own preview overlay, and we do frame our own pages in previews.
   *
   * A Content-Security-Policy is deliberately NOT here. It is the right next
   * step and it is not a one-line one: this app inlines styles and runs Next's
   * own bootstrap script, so a useful policy needs nonces threaded through the
   * document. Shipping a permissive CSP to look protected would be worse than
   * shipping none.
   */
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          // Stop a browser from guessing a type we did not declare, which is
          // what turns an uploaded file into a script.
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          // Send the full URL to ourselves, only the origin to anyone else. Our
          // URLs carry `?ref=` codes and auth `?next=` paths, and the traffic
          // module already refuses to store those for the same reason.
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          // Nothing in this product uses any of these, so nothing embedded in a
          // page should be able to ask for them.
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), payment=()",
          },
        ],
      },
    ];
  },
  async redirects() {
    return [
      ...LEGACY_GUIDE_PLACE_IDS.map((id) => ({
        source: `/guide/${id}`,
        destination: `/guide/places/${id}`,
        permanent: true,
      })),
      // Renamed city hubs. A hub id is a public URL that was in the sitemap, so
      // a rename has to redirect rather than 404. Duplicated from
      // lib/data/legacy-guide-urls.ts (RENAMED_HUB_IDS) for the same reason as
      // the list above, and held honest by the same unit test.
      ...Object.entries(RENAMED_HUB_IDS).map(([from, to]) => ({
        source: `/guide/cities/${from}`,
        destination: `/guide/cities/${to}`,
        permanent: true,
      })),
      // The planner's board and maps list stopped being routes: they are lenses
      // of `/planner`, over one loaded dataset, because three pages behind a
      // control shaped like a tab strip is what made the section read as three
      // products. Both addresses were live and linked, so they redirect.
      //
      // Enumerated exactly, never `/planner/maps/:path*` — `/planner/maps/<id>`
      // is still a real page, because one map is a document a student can send
      // to someone, and a pattern here would swallow it.
      ...PLANNER_VIEW_REDIRECTS.map(([from, view]) => ({
        source: from,
        destination: `/planner?view=${view}`,
        permanent: true,
      })),
    ];
  },
};

export default nextConfig;
