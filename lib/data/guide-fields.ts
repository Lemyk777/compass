import { FACULTY_VALUES, type FacultyValue } from "@/lib/data/faculties";

// The guide's field filter, expressed as a URL parameter instead of component
// state.
//
// The guide used to be one page holding `useState<FacultyValue[]>`, which meant
// the filter could not be shared, could not be linked to, and was silently
// thrown away the moment a student opened a destination page and pressed back.
// Now it lives in `?f=` and every guide route reads it, so the whole section is
// addressable: /guide/cities?f=computer_science is a real, sendable thing.
//
// Three states, and the difference between the last two is load-bearing:
//
//   f absent      → not stated. Signed in, that means "the student's own fields"
//                   (resolved server-side); signed out it means everything.
//   f=all         → stated, and the answer is "show me everything". This is what
//                   clearing the chips writes, so a student who deliberately
//                   widened the guide does not get their profile re-applied on
//                   the next navigation.
//   f=a,b         → those fields.
//
// Pure and client-safe on purpose: the tabs and the chips are client islands and
// must not drag a server module (or the datasets) into their bundle.

/** `?f=all` — stated, and the answer is "everything". */
export const ALL_FIELDS = "all";

/** The query parameter the whole guide reads. */
export const FIELDS_PARAM = "f";

const VALID = new Set<string>(FACULTY_VALUES);

/**
 * Reads `?f=`. Returns `null` for "not stated" — the caller decides what the
 * default is — and `[]` for the explicit "show me everything".
 *
 * Unknown values are dropped rather than rejected: a hand-edited or stale URL
 * should narrow the guide oddly, never 404 it.
 */
export function parseFieldsParam(
  param: string | string[] | undefined,
): FacultyValue[] | null {
  const raw = Array.isArray(param) ? param[0] : param;
  if (raw === undefined) return null;
  if (raw === ALL_FIELDS || raw === "") return [];
  const seen = new Set<FacultyValue>();
  for (const part of raw.split(",")) {
    const v = part.trim();
    if (VALID.has(v)) seen.add(v as FacultyValue);
  }
  // Every value was junk ⇒ treat it as "everything", not as "nothing". Same
  // rule as the catalog: an unknown fact never empties a student's screen.
  return [...seen];
}

/** The value to write back into the URL. `[]` becomes `all`, never blank. */
export function serializeFields(fields: FacultyValue[]): string {
  return fields.length === 0 ? ALL_FIELDS : fields.join(",");
}

/**
 * A guide href carrying the current filter — what every link inside the section
 * uses, so moving between tabs, into a detail page and back never loses it.
 * `null` (not stated) is left alone: adding `?f=` would freeze the student's own
 * fields into the URL and defeat the default.
 */
export function withFields(href: string, fields: FacultyValue[] | null): string {
  if (fields === null) return href;
  return `${href}?${FIELDS_PARAM}=${serializeFields(fields)}`;
}

/**
 * The same thing for an href that already carries a query string — the compare
 * view, whose two countries are themselves parameters. Separate function rather
 * than string-surgery on `withFields` at each call site, because "replace the
 * ? with &" is the kind of line that is wrong exactly once and silently.
 */
export function fieldsSuffix(fields: FacultyValue[] | null): string {
  if (fields === null) return "";
  return `&${FIELDS_PARAM}=${serializeFields(fields)}`;
}
