"use client";

import { useState, useTransition } from "react";
import { applyAsPartner } from "@/app/partners/apply/actions";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Input";

// The application itself. Six fields, because an organisation that has to
// assemble a submission pack will simply not bother — and the one thing we
// actually have to establish (that this account speaks for that organisation)
// is settled by a reply to their contact address, not by a longer form.

export function ApplyForm({ defaultEmail }: { defaultEmail: string }) {
  const [name, setName] = useState("");
  const [website, setWebsite] = useState("");
  const [country, setCountry] = useState("");
  const [city, setCity] = useState("");
  const [contactEmail, setContactEmail] = useState(defaultEmail);
  const [about, setAbout] = useState("");
  const [note, setNote] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [pending, startTransition] = useTransition();

  function submit() {
    startTransition(async () => {
      const res = await applyAsPartner({
        name,
        website,
        country,
        city,
        contactEmail,
        about,
        note,
      });
      if (res.ok) {
        setSent(true);
        setError(null);
      } else {
        setError(res.error);
      }
    });
  }

  if (sent) {
    return (
      <div className="rounded-2xl border border-ivy/30 bg-ivy-soft/60 p-6">
        <p className="text-base font-semibold text-ink">
          That&rsquo;s with us.
        </p>
        <p className="mt-2 text-sm leading-relaxed text-ink-soft">
          We check one thing before listing an organisation: that this account
          really belongs to it. We&rsquo;ll write to{" "}
          <span className="font-medium text-ink">{contactEmail}</span>. Once
          that&rsquo;s done you can post straight away, with no queue.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      className="space-y-4 rounded-2xl border border-line bg-card p-6 shadow-card"
    >
      <Field
        label="Organisation"
        hint="The name students will see on every card you post."
      >
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Astana Hub"
          maxLength={120}
          required
        />
      </Field>

      <Field label="Website">
        <Input
          type="url"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
          placeholder="https://astanahub.com"
          maxLength={200}
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Country" hint="Sets who sees your local posts.">
          <Input
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            placeholder="Kazakhstan"
            maxLength={60}
            required
          />
        </Field>
        <Field label="City">
          <Input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Astana"
            maxLength={60}
          />
        </Field>
      </div>

      <Field
        label="Contact email"
        hint="An address at your own domain is the fastest way for us to confirm this is you."
      >
        <Input
          type="email"
          value={contactEmail}
          onChange={(e) => setContactEmail(e.target.value)}
          maxLength={120}
          required
        />
      </Field>

      <Field
        label="Who you are"
        hint={`Two sentences, shown on your public page. ${600 - about.length} characters left.`}
      >
        <textarea
          value={about}
          onChange={(e) => setAbout(e.target.value.slice(0, 600))}
          rows={3}
          required
          className="w-full rounded-xl border border-line bg-card px-3.5 py-2.5 text-[0.95rem] text-ink placeholder:text-ink-faint focus-visible:focus-ring"
          placeholder="A technology hub in Astana. We run hackathons, bootcamps and an incubator for school and university students across Kazakhstan."
        />
      </Field>

      <Field
        label="What you'd post (optional)"
        hint="Only we read this. It helps us confirm who you are."
      >
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value.slice(0, 600))}
          rows={2}
          className="w-full rounded-xl border border-line bg-card px-3.5 py-2.5 text-[0.95rem] text-ink placeholder:text-ink-faint focus-visible:focus-ring"
          placeholder="Our summer hackathon for school students, and the autumn incubator intake."
        />
      </Field>

      {error && (
        <p
          role="alert"
          className="rounded-xl border border-reach/40 bg-reach-soft/50 px-4 py-3 text-sm text-ink"
        >
          {error}
        </p>
      )}

      <Button type="submit" size="md" disabled={pending}>
        {pending ? "Sending…" : "Send the application"}
      </Button>
    </form>
  );
}
