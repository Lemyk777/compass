// The characters the Open Graph cards must be able to draw.
//
// The two cards run on the edge runtime and carry their own font, and a Vercel
// Edge Function is capped at 1 MB compressed — full Latin Inter put the bundle
// at 1.06 MB gzip and the deploy failed while `next build` passed everywhere.
// So the fonts are subset (scripts/subset-og-fonts.ts), and this is the set
// they are subset TO.
//
// A glyph missing from a subset does not error: it renders as a blank box, on a
// public card, in someone else's chat. So two rules hold this together —
//
//   • RANGES, not the exact characters in today's catalog. Deriving the set
//     from the 172 rows would mean the day a partner posts a title with a new
//     character, that character breaks the preview and nothing else.
//   • A test asserts the catalog is a subset of this. It is what turns "I hope
//     I listed enough" into a build failure with the offending row named.
//
// Cyrillic is here because the catalog already contains it — Турнир городов is
// a real entry — and because this product is built for students in Kazakhstan
// and Georgia, so it is the last alphabet that should degrade quietly.

function range(from: string, to: string): string {
  let out = "";
  for (let c = from.codePointAt(0)!; c <= to.codePointAt(0)!; c++) {
    out += String.fromCodePoint(c);
  }
  return out;
}

export const OG_GLYPHS =
  // Printable ASCII, which is most of every card.
  range(" ", "~") +
  // Latin-1 Supplement: accented names travel (Télécom, Køge, Zürich, España),
  // and the block also carries °, ², ³, ×, ÷, £, ¥, ·, «», ¡¿.
  range(" ", "ÿ") +
  // Latin Extended-A: Polish, Czech, Turkish, Hungarian organiser names.
  range("Ā", "ſ") +
  // Cyrillic, upper and lower, plus Ё/ё which sit outside the main run.
  range("А", "я") +
  "Ёё" +
  // Typographic punctuation the copy actually uses, and the arrows and maths
  // that appear in eligibility and cost lines.
  "–—‘’“”…†•" +
  "←→≤≥−€™№";
