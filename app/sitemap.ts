import type { MetadataRoute } from "next";
import { CANONICAL_URL } from "@/lib/site";
import { allCareerAreas, areaSlug } from "@/lib/data/careers";
import { GUIDE_SECTIONS } from "@/lib/data/guide-sections";
import { MAJORS } from "@/lib/data/majors";
import { STUDY_DESTINATIONS } from "@/lib/data/study-destinations";
import { HUBS } from "@/lib/data/world";
import { COMPETITIONS } from "@/lib/data/competitions-data";

// Every public page, listed for crawlers.
//
// The guide was made public on purpose — a family deciding between Germany and
// Korea should be able to read it without an account — and that only means
// something if they can arrive. Until this file existed, nothing told a crawler
// that 66 evergreen pages, written for queries our students actually type,
// were there at all: only the root was linked from anywhere outside the app.
//
// Built from the same registries the pages are built from (`GUIDE_SECTIONS`,
// `allCareerAreas`, `STUDY_DESTINATIONS`, `HUBS`), so a new country or area of
// work is listed the moment it exists. A hand-maintained list would be wrong
// within a week — the same reason the landing page counts the catalog instead
// of quoting a number.
//
// Deliberately NOT here:
//
// - `lastModified`. Next would happily let us stamp `new Date()` on all 79
//   entries, which would tell a crawler the whole site changed on every deploy.
//   We do not track when a country profile was last revised, so the honest
//   answer is to say nothing rather than to say something we cannot stand
//   behind — the same rule as "never show a countdown for a date we can't
//   stand behind".
// - `changeFrequency` / `priority`. Both are ignored by every major crawler.
// - `/guide/compare`. Its content is two countries chosen by query string —
//   110 near-duplicate combinations. Reachable and indexable through the links
//   on every country page, with a canonical that folds the mirrored pair
//   (a=x&b=y and a=y&b=x) into one; it just isn't something to advertise.
// - Anything behind a login (`/dashboard`, `/admin`, `/partner`), and `/demo`,
//   which is a preview of a report built from a sample profile.
// - `/partners/[id]`. Those are database rows, and reading them here would turn
//   the sitemap into a per-request query against Supabase. They are linked from
//   `/partners`, which is listed, so a crawler still reaches them.

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const paths = [
    // The front door, and the product it opens on.
    "/",
    "/opportunities",

    // Every opportunity at its own address. These are the pages students
    // actually send each other, and each one answers a query someone types
    // ("who can enter the AMC", "is Kaggle free") — which the list page,
    // being one document, cannot rank for.
    //
    // The CURATED catalog only. A partner's live post also has a page, but
    // reading those here would turn a static sitemap into a per-request query
    // against Supabase — the same reason `/partners/[id]` is absent. They are
    // linked from the list and from the partner's own profile.
    ...COMPETITIONS.map((c) => `/opportunities/${c.id}`),

    // The guide: its index, its five steps, then every subject inside them.
    "/guide",
    ...GUIDE_SECTIONS.map((s) => s.href),
    ...allCareerAreas().map(
      ({ area }) => `/guide/work/${areaSlug(area.title)}`,
    ),
    ...MAJORS.map((m) => `/guide/majors/${m.id}`),
    ...STUDY_DESTINATIONS.map((d) => `/guide/places/${d.id}`),
    ...HUBS.map((h) => `/guide/cities/${h.id}`),

    // Organisations that post their own opportunities.
    "/partners",
    "/partners/apply",

    // Who runs this and what it refuses to do. Public on purpose: a family
    // deciding whether to trust a site that advises their child should be able
    // to read it before making an account, and a crawler should be able to find
    // it without following a footer link.
    "/about",
    "/privacy",
    "/terms",
  ];

  return paths.map((path) => ({ url: `${CANONICAL_URL}${path}` }));
}
