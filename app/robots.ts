import type { MetadataRoute } from "next";
import { CANONICAL_URL } from "@/lib/site";

// There was no robots.txt at all, which is not the neutral state it sounds
// like: it left a crawler to discover 66 evergreen public pages by following
// links from the root, and left every preview deployment as indexable as
// production.
//
// Two rules, and the second one is the one that bites:
//
// 1. Only production is indexable. A Vercel preview serves the same HTML on a
//    *.vercel.app host; indexed, it competes with the canonical domain for our
//    own content. The traffic module already refuses to record those hosts for
//    the same reason (lib/traffic/track.ts).
// 2. robots.txt matches by PREFIX, so `Disallow: /partner` would also hide
//    `/partners` — the public list of partner organisations, one of the few
//    pages we most want found. The `$` anchors it to the console page alone.
//    Google honours `$`; the paths that need a whole subtree blocked end in `/`
//    instead.

export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  const isPreview =
    Boolean(process.env.VERCEL_ENV) && process.env.VERCEL_ENV !== "production";

  if (isPreview) {
    return { rules: { userAgent: "*", disallow: "/" } };
  }

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        "/admin",
        "/dashboard",
        "/onboarding",
        "/ambassador",
        "/auth/",
        // The partner console only. `/partners` (public) stays crawlable.
        "/partner$",
      ],
    },
    sitemap: `${CANONICAL_URL}/sitemap.xml`,
  };
}
