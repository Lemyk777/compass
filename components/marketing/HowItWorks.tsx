import Link from "@/components/ui/Link";
import { Band } from "@/components/marketing/Band";

// The three steps of the FRONT DOOR — not of the admission report.
//
// This used to describe the scoring pipeline ("tell us about you → we score you
// → get your game plan"), which is the report's mechanism, not the product a
// student arrives for. What they arrive for is the list of things they can
// enter, and it takes two questions to produce.
//
// Server component with no scroll animation. The former version wrapped every
// card in framer-motion's ScrollReveal, which held the content at `opacity: 0`
// inside an `overflow-hidden` box until an observer fired — the page's actual
// text depending on an animation finishing, and ~50 kB of motion library on a
// page whose only job is to be readable immediately.
export function HowItWorks() {
  const steps = [
    {
      title: "Say what year you're in",
      body: "One tap. Almost every entry rule in the catalog is an age or a school-year rule, so this single answer already removes most of what isn't for you.",
    },
    {
      title: "Say what you're into",
      body: "Pick your fields, or leave it blank and see everything. If you genuinely don't know yet, a two-minute quiz will suggest a starting point rather than demand an answer.",
    },
    {
      title: "Get the list you can actually enter",
      body: "Each one with who can enter, what it really costs, and when it closes. Nothing is hidden behind an account, and nothing shows a countdown we can't stand behind.",
    },
  ];

  return (
    <section className="w-full px-5 py-24 md:px-12 md:py-28 lg:px-20">
      <Band>
        <div className="mb-14 max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ivy">
            How it works
          </p>
          <h2 className="mt-3 text-balance text-3xl font-medium tracking-tight text-ink md:text-4xl">
            Two questions, then the list.
          </h2>
          <p className="mt-4 max-w-xl text-pretty text-lg font-light leading-relaxed text-ink-soft">
            No account, no questionnaire, no waiting on a model to think. The
            matching is plain arithmetic against rules we&rsquo;ve read off the
            organisers&rsquo; own pages.
          </p>
        </div>

        <ol className="grid gap-6 md:grid-cols-3">
          {steps.map((s, i) => (
            <li
              key={s.title}
              className="flex flex-col rounded-2xl border border-line bg-card p-7 shadow-card transition-shadow duration-300 hover:shadow-lift"
            >
              <span
                data-num
                className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-ivy-soft text-base font-semibold text-ivy-ink"
              >
                {i + 1}
              </span>
              <h3 className="mt-6 text-xl font-medium text-ink">{s.title}</h3>
              <p className="mt-3 text-base font-light leading-relaxed text-ink-soft">
                {s.body}
              </p>
            </li>
          ))}
        </ol>

        <p className="mt-8 text-sm text-ink-faint">
          Already know your year?{" "}
          <Link
            href="/opportunities"
            className="font-medium text-ink underline underline-offset-2 transition hover:text-ivy-ink"
          >
            Start here. It takes about ten seconds
          </Link>
        </p>
      </Band>
    </section>
  );
}
