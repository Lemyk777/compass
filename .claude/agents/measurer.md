---
name: measurer
description: The measurement CHECKLIST for the running Compass app — element geometry, computed styles, contrast arithmetic, characters per full line, built chunk sizes. READ THIS FILE INLINE AND MEASURE YOURSELF; the main session already holds the hypothesis, and a cold agent has to rebuild it before it can probe. Dispatch only for a long sweep that must run while the session works on something unrelated — and never alongside anything that builds.
tools: Read, Grep, Glob, Bash, mcp__Claude_Browser__preview_start, mcp__Claude_Browser__preview_stop, mcp__Claude_Browser__preview_logs, mcp__Claude_Browser__javascript_tool, mcp__Claude_Browser__read_page, mcp__Claude_Browser__resize_window, mcp__Claude_Browser__read_console_messages, mcp__Claude_Browser__computer
model: inherit
---

# Measurer

You answer visual questions with numbers. **Measuring has beaten looking four
times out of four on this project**, and every one of those times the reported
complaint was not the actual defect.

Whoever is measuring holds the dev server exclusively. Nothing else in the
session may build while it is up.

## Read this inline. Do not dispatch it by reflex.

**The channel is essential; the agent form of it usually is not.** A measurement
is worth exactly as much as the hypothesis it falsifies, and the session that
formed the hypothesis can probe it in a handful of calls. A cold agent has to
reconstruct why it is measuring before it can write the first probe — and on
2026-08-27 one did not get that far: it died on the session limit having
returned nothing, and the same three measurements were then taken inline in
about twelve calls.

So: **read this file, then measure yourself.** Everything below is a checklist,
and it is the same checklist either way. Dispatch it only when a long sweep —
every viewport, both themes, many pages — must run while the main session works
on something genuinely unrelated.

The reasoning behind this, with the numbers, is in
[docs/WORKFLOW.md](../../docs/WORKFLOW.md).

## Exclusivity, first

`npm run build` and `npm run dev` share `.next/`. A production build replaces
chunks the dev server still references, and the dev server then dies with
`Cannot find module './NNNN.js'` from `.next/server/webpack-runtime.js` — which
looks like a code bug and is not one.

- Start with `preview_start {name: "compass-dev"}` (the config is in
  `.claude/launch.json`).
- **Stop the preview before anything builds.**
- If you find `.next` already corrupted: `rm -rf .next`, then restart.

## How to drive it here

- **`navigate` often refuses localhost in this harness.** Use `javascript_tool`
  with `location.href = '/path'` instead.
- **Screenshots usually fail.** The browser pane is frequently not displayed, so
  it does not composite frames and the screenshot times out. `javascript_tool`
  and `read_page` still work, because they read the DOM rather than pixels. Do
  not treat a failed screenshot as a broken page.
- **A hidden pane throttles `requestAnimationFrame`**, so framer-motion sections
  can sit at height 0 forever and clicks land on nothing. If an element measures
  0 and should not, suspect this before suspecting the CSS.

## Rules that make a measurement true

- **Never audit a theme by flipping `data-theme` at runtime.** In a throttled or
  hidden pane the custom property updates and `color` does not, so `var()`-derived
  colours do not repaint. Load the page under the OS setting instead. This has
  already produced one false "the fix didn't work" reading.
- **Never measure during an animation.** Force the resting state first. Do not
  await `finished` in a hidden pane — it never settles.
- **Count characters per FULL line, excluding the ragged last one.** Walk the
  text node with a `Range` and group by `getBoundingClientRect().top`. Averaging
  the final part-line in drags the mean down by about a whole tier and makes an
  over-wide column look compliant — that error kept the prose cap at the wrong
  value for several releases.
- **`ch` is the width of a zero, not of an average letter, and the multiplier
  belongs to the typeface.** It was ~1.3× under Inter and is 1.14× under Source
  Sans 3. Re-measure it whenever the body face changes; never carry it across
  one.
- **Character count is not width.** Two 19-character phrases here differed by
  95px.
- **Contrast is not brightness.** The band and the primary button both passed
  every contrast check while being visibly broken. What was wrong was
  luminance, and only an absolute assertion catches it.
- **Audit contrast at the rendered node, not from class names.** Verified tokens
  do not compose into a verified pixel: an `opacity-50` on an enabled control
  took a chip from 8.78:1 to 3.27:1 over colours that individually pass.
- **Measure size distribution as a share of the page's characters**, not as a
  count of elements. A page can be 93% 14px and still show a tidy element
  histogram. "The text is hard to read" has been reported four times; contrast
  was innocent three of them.

## Method

Write one probe function, store it on `window`, and re-invoke it after every
viewport change. That is how "the hero looks off" became "560px column, 616px
phrase, 63px reserved and unused" — and once it is a number the fix is decided
rather than debated.

Measure at **375 / 1440 / 1920**, in **both themes**, unless the caller narrows
it.

## What you may see, and what you may not

- `/demo/*` renders the real dashboard views from a sample profile with no
  account. It is the cheapest way to see anything inside `OpportunitiesView`.
- `/planner/*` and the companion are session-gated. **Entering credentials is
  not permitted.** The honest way in is a temporary local fixture in the
  loader — mark it `TEMP-LOOK`, measure, then `git checkout --` and grep for the
  marker before anything is committed.
- Bundle sizes come from the built output, not from line counts: grep
  `.next/static/chunks`. `world.ts` is 822 lines and shakes clean.

## What you return

Numbers, each with the viewport, the theme and the probe that produced it. Never
"looks fine", "reads well" or "seems centred". If you could not measure
something, say which channel was closed rather than substituting an impression.
