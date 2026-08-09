/**
 * A chart plus the same numbers in words, for anyone who cannot see it.
 *
 * Recharts draws an `<svg>` carrying an empty `<title>`, no `role` and no
 * `aria-label`, so to a screen reader the report's radar and its school
 * comparison were a blank rectangle — the values existed nowhere else on the
 * page. That is the one rule in the charts category that is not a nicety: a
 * chart is a rendering OF data, and the data has to survive the rendering.
 *
 * The visual is marked `aria-hidden` rather than labelled, because a single
 * `aria-label` on a chart can only ever be a summary; a reader is owed the
 * figures. The list is `sr-only`, so nothing changes on screen.
 *
 * Where the numbers are ALREADY on screen as text — `OverallGauge` prints its
 * score and band beside the dial — the right treatment is `aria-hidden` on the
 * graphic alone and no list, or the same value gets announced twice.
 */
export function ChartFigure({
  label,
  rows,
  children,
}: {
  /** What the chart is, as a sentence a person would say. */
  label: string;
  /** Every plotted value, in the order it is drawn. */
  rows: { name: string; value: string }[];
  children: React.ReactNode;
}) {
  return (
    <figure className="m-0">
      <div aria-hidden>{children}</div>
      <figcaption className="sr-only">
        {label}
        <ul>
          {rows.map((r) => (
            <li key={r.name}>
              {r.name}: {r.value}
            </li>
          ))}
        </ul>
      </figcaption>
    </figure>
  );
}
