import { GuideSkeleton } from "@/components/guide/Skeleton";

// Why the guide's skeleton lives in six small files instead of one, and why
// this page sits inside a `(index)` route group at all.
//
// There used to be a single `app/guide/loading.tsx` covering the whole section.
// A `loading.tsx` is a Suspense boundary, and a Suspense boundary lets the
// server flush the HTML shell — status line included — before the page below it
// has rendered. So by the time `/guide/places/whatever` called `notFound()`,
// a 200 had already been sent: every unknown id in the guide answered "200 OK"
// carrying a not-found page. That is the one status a crawler must not see for
// an address that does not exist, and it was section-wide.
//
// Measured, not guessed: with the boundary removed, the same URLs return a real
// 404 and the known ones still return 200.
//
// A route group contributes nothing to the URL, so `(index)` keeps this page at
// `/guide` while giving it a boundary the subject pages underneath do not
// inherit. `work/(list)`, `places/(list)` and `cities/(list)` exist for the same
// reason; `from-home` and `compare` have no children, so they just carry their
// own file.
//
// The skeleton is on the lists because that is where the wait is: a list page
// resolves the reader's session (`guideView`), which for a signed-in student is
// an auth round trip. A subject page reads static data and a query string —
// there is nothing to wait for, and a fallback there would also replace the
// heading the card morphs into.
export default function GuideIndexLoading() {
  return <GuideSkeleton />;
}
