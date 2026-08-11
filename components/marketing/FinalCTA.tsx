import { ButtonLink } from "@/components/ui/Button";
import { COMPETITIONS } from "@/lib/data/key-dates";

// The close. `signedIn` keeps it honest for a returning student: they get the
// way back into their own list rather than a fresh sign-up, which read as "the
// site forgot me".
//
// Server component now. It was a client component whose only JS was a
// framer-motion `useInView` fade — an animation that held the page's final
// call-to-action invisible until an observer fired, on a section that has one
// job. The entrance is gone; the button is simply there.
export function FinalCTA({ signedIn = false }: { signedIn?: boolean }) {
  return (
    <section className="w-full bg-surface px-5 py-24 md:px-12 md:py-28 lg:px-20">
      <div className="relative mx-auto max-w-3xl overflow-hidden rounded-[2rem] border border-line bg-card px-8 py-16 text-center shadow-lift md:py-20">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 left-1/2 -z-10 h-64 w-64 -translate-x-1/2 rounded-full bg-ivy-soft opacity-60 blur-3xl"
        />
        <h2 className="text-balance text-3xl font-medium tracking-tight text-ink md:text-4xl">
          See what you can enter this year.
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-pretty text-lg font-light leading-relaxed text-ink/60">
          One question — what year are you in — and you get the list.{" "}
          <span data-num className="font-medium text-ink-soft">
            {COMPETITIONS.length}
          </span>{" "}
          opportunities, every link and date checked by hand.
        </p>
        {/* The same primary/secondary pair as the hero, and it used to be built
          from scratch here out of raw `<Link>`s — which meant no focus ring, no
          press feedback, and a second definition of "primary" that a change to
          the real one would never reach. */}
        <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
          <ButtonLink href="/opportunities" size="lg" shape="pill">
            {signedIn ? "Open my opportunities" : "See what you can enter"}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M5 12h14M13 6l6 6-6 6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </ButtonLink>
          <ButtonLink href="/guide" variant="subtle" size="lg" shape="pill">
            Where can it lead?
          </ButtonLink>
        </div>
        <p className="mt-6 text-sm text-ink-faint">
          Free, all of it. No account needed to start.
        </p>
      </div>
    </section>
  );
}
