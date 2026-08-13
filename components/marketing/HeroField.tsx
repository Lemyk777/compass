import type { CSSProperties } from "react";

// The light behind the landing page's first screen (#24).
//
// The hero used to paint `bg-surface` and stop. On the light theme that reads
// as clean; on the dark one `--surface` is 11 17 28, so the top of the page —
// the header strip, the badge, the <h1>, both calls to action — was a flat
// near-black rectangle. The only two light sources in the section sat in the
// RIGHT column behind the opportunity card, which is to say nowhere near the
// half of the hero that carries the promise. Those two are gone; this owns the
// light for the whole section now.
//
// It is a SERVER component and it ships no JavaScript. Every rule from #23
// still binds: no framer-motion on this page, transform and opacity only, no
// animated `filter`. The paint, the masks and the keyframes all live in
// app/globals.css under "THE HERO FIELD" — including the reasoning for the
// three things that are easy to get wrong (gradient stops that must not be the
// keyword `transparent`, a lattice that must drift exactly one cell, and loops
// that must be closed because the reduced-motion guard lands a reader on the
// END state).
//
// Four layers, back to front:
//
//   1. the beam    — a wash down from the very top edge, plus a slow sheen
//                    crossing it. This is the literal answer to the report:
//                    the top of the page now has a light source.
//   2. the lattice — hairline grid, masked so it is densest at top-centre and
//                    dissolved before the bottom edge, drifting one cell.
//   3. the aurora  — three radial-gradient blobs on three unrelated periods.
//                    Weighted LEFT, because the left is the half that was dark.
//   4. the sparks  — three points travelling the lattice. The page is about
//                    routes a student can take; something moves along them.
//
// `aria-hidden` and `pointer-events-none` throughout: this is decoration, it
// carries no information, and nothing in it may ever intercept a click meant
// for the call to action sitting on top of it.

/** A spark's travel distance, set per instance. */
type SparkStyle = CSSProperties & { "--field-run": string };

const SPARKS: { pos: string; style: SparkStyle }[] = [
  {
    pos: "left-[4%] top-[34%]",
    style: { "--field-run": "620px" },
  },
  {
    // Runs the other way, so the field never reads as a conveyor belt.
    pos: "right-[8%] top-[63%]",
    style: { "--field-run": "-540px", animationDelay: "-11s" },
  },
  {
    pos: "left-[20%] top-[80%]",
    style: { "--field-run": "480px", animationDelay: "-21s" },
  },
];

export function HeroField() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      {/* 1 — the top. A wash from the edge down, and a sheen crossing it. The
        sheen's element is wider than the section so its own soft ends never
        travel into view. */}
      <div className="field-beam absolute inset-x-0 top-0 h-[42vh]" />
      <div className="field-sweep absolute -inset-x-1/3 top-0 h-[30vh]" />

      {/* 2 — the lattice. The mask is on the static parent; the grid inside it
        is oversized so a full cell of drift never uncovers an edge. */}
      <div className="field-grid-mask absolute inset-0">
        <div className="field-grid absolute -inset-24" />
      </div>

      {/* 3 — the aurora. Sizes are a single `min()` rather than four
        breakpoints: a blob has no content to reflow, so it should simply scale
        with the viewport it is lighting.

        The VERTICAL anchors are `vh`, and that is not a style preference — it
        is a bug fix. They were percentages of the section, and the section is
        ~900px on a desktop and 1635px on a 375px phone, because below `lg` the
        message and the card stack instead of sitting side by side. Measured at
        375: the accent blob ended 774px above the fold and the ivy one started
        90px BELOW the section it was clipped to, so two of the three lights
        simply were not there on the layout most of our students read us on.
        A viewport unit anchors each blob to what a reader can actually see,
        which is the only frame that means the same thing in both layouts. */}
      <div className="field-glow field-glow-a -left-[12%] -top-[16vh] h-[min(48rem,86vw)] w-[min(48rem,86vw)]" />
      <div className="field-glow field-glow-b left-[13%] top-[54vh] h-[min(36rem,72vw)] w-[min(36rem,72vw)]" />
      {/* The warm one, and the only one on the right: it replaces the pair of
        blurred blobs that used to sit behind the opportunity card. */}
      <div className="field-glow field-glow-c -right-[12%] -top-[2vh] h-[min(40rem,78vw)] w-[min(40rem,78vw)]" />

      {/* 4 — the sparks. Hidden below `sm`: on a phone the hero is one column,
        the card fills most of it, and three points crossing behind live text
        is noise rather than atmosphere. */}
      {SPARKS.map((s) => (
        <div
          key={s.pos}
          style={s.style}
          className={`field-spark hidden h-[3px] w-[3px] sm:block ${s.pos}`}
        />
      ))}
    </div>
  );
}
