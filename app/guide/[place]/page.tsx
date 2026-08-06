import { notFound, permanentRedirect } from "next/navigation";
import { destinationById } from "@/lib/data/study-destinations";

// The old address of a destination profile.
//
// Country profiles used to live at `/guide/[place]` — a dynamic segment sitting
// directly in the root of the guide, which is fine right up until the section
// grows sub-routes: from then on every new page name (`work`, `cities`,
// `places`, `from-home`) is also a string that must never be mistaken for a
// country. The App Router does match static segments before dynamic ones, so it
// worked, but the rule that kept it working was invisible and one bad id away
// from serving a 404 as a country page. The profiles moved to
// `/guide/places/[place]`.
//
// This file stays behind to keep the old links alive — they are in shared
// messages and, since the guide is public, possibly in search results.
// Validating against the registry matters: without it, `/guide/anything` would
// bounce to a `/guide/places/anything` that 404s, which turns one wrong URL into
// a redirect chain ending nowhere.

export default function LegacyDestinationRedirect({
  params,
}: {
  params: { place: string };
}) {
  if (!destinationById(params.place)) notFound();
  permanentRedirect(`/guide/places/${params.place}`);
}
