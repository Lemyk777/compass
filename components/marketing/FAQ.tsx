import { JsonLd } from "@/components/seo/JsonLd";
import { faqSchema } from "@/lib/schema";

// Objection handling, rewritten for the front door: the questions a student (or
// their parent) actually has before clicking, which are about cost, age, and
// whether the dates can be trusted — not about how a score is computed.
//
// Native <details>, so this ships ZERO JavaScript. The previous version was a
// client component that pulled in framer-motion's AnimatePresence to animate a
// height, and mounted an IntersectionObserver to fade the heading in. It also
// kept the answers out of the DOM until opened, which hid them from search.
// Every answer is now in the HTML on first paint, keyboard-operable for free,
// and open/close costs the browser one repaint.

// Exported so the page's `FAQPage` markup below is built from the questions
// actually rendered, rather than from a second list written out for crawlers.
// Google's rule for this markup is that every answer is already visible on the
// page; a copy would satisfy the validator and stop being true the first time
// one of these was reworded.
export const FAQ_ITEMS: { q: string; a: string }[] = [
  {
    q: "What is this, exactly?",
    a: "A checked list of competitions, olympiads, courses and programmes school students can enter. Filtered to the ones open to you at your age, from where you live. You give your school year, we give the list.",
  },
  {
    q: "Do I need an account?",
    a: "No. The eligibility checker on the Opportunities page works signed out and gives you the full answer. An account only adds the things that need memory: saving what you're doing, tracking a deadline, and the optional admission report.",
  },
  {
    q: "Is it free?",
    a: "Compass is free, all of it. Some of the opportunities themselves are not, and that is exactly why every entry carries a cost label. 'Free to learn, the certificate costs money' is the case students get caught by, so it gets its own label rather than being filed under free.",
  },
  {
    q: "How do I know a deadline is right?",
    a: "Because we only show a countdown when we've confirmed the date against the organiser's own page for the current cycle. Everything else says 'dates not announced yet' or 'open now'. A guessed deadline is worse than no deadline: it makes a student miss a real one.",
  },
  {
    q: "I'm 13. Is there anything for me?",
    a: "Yes, and you'll see the ones you're too young for as well. Labelled with the year you become eligible. Knowing what to aim for is worth something; being quietly shown nothing is not. We never hide an opportunity just because a fact about you is missing.",
  },
  {
    q: "What happened to the university assessment?",
    a: "It's still here, and it's still free. It's now one thing you can opt into rather than the gate you had to pass first. It reads your profile against admitted-student data for the US, Italy, Hong Kong, the UAE and Korea, and gives per-school ranges with the honest number, not a flattering one.",
  },
];

export function FAQ() {
  return (
    <section className="w-full bg-surface px-5 py-24 md:px-12 lg:px-20">
      {/* The markup rides with the component that renders the questions, not
          with the page that places it, so the two cannot be moved apart. */}
      <JsonLd data={faqSchema(FAQ_ITEMS)} />
      <div className="mx-auto max-w-3xl">
        <div className="mb-12 text-center">
          <h2 className="text-balance text-3xl font-medium tracking-tight text-ink md:text-4xl">
            Questions, answered
          </h2>
          <p className="mt-4 text-lg font-light text-ink-soft">
            The honest answers, before you start.
          </p>
        </div>

        <div className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-card shadow-card">
          {FAQ_ITEMS.map((it, i) => (
            <details key={it.q} className="group" open={i === 0}>
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-6 py-5 text-left transition-colors hover:bg-ink/[0.015]">
                <span className="text-base font-medium text-ink">{it.q}</span>
                <span
                  className="shrink-0 text-ivy transition-transform duration-300 group-open:rotate-45"
                  aria-hidden="true"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M12 5v14M5 12h14"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                </span>
              </summary>
              <p className="animate-fade-up px-6 pb-5 text-pretty text-base font-light leading-relaxed text-ink-soft">
                {it.a}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
