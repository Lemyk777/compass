"use client";

import { useState, useTransition } from "react";
import type { Partner } from "@/lib/data/partners";
import type { PartnerPost } from "@/lib/partners/queries";
import {
  postOpportunity,
  savePartnerProfile,
  setOpportunityPublished,
  updateOpportunity,
} from "@/app/partner/actions";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Input";
import { formatDate } from "@/lib/data/opportunity-format";
import {
  EMPTY_OPPORTUNITY,
  OpportunityForm,
  type OpportunityFormValues,
} from "./OpportunityForm";

// The partner's workspace: everything they have posted, and the form to post
// another one.
//
// Deliberately not a dashboard of metrics. A partner needs to answer three
// questions here — what is live under my name, is any of it wrong, and how do I
// add one more — and anything else on the page competes with those.

type Editing = { mode: "new" } | { mode: "edit"; post: PartnerPost } | null;

export function PartnerConsole({
  partner,
  posts,
  canPost,
}: {
  partner: Partner;
  posts: PartnerPost[];
  canPost: boolean;
}) {
  const [editing, setEditing] = useState<Editing>(null);
  const [showProfile, setShowProfile] = useState(false);

  if (editing) {
    return (
      <section>
        <h2 className="mb-4 text-lg font-semibold tracking-tight text-ink">
          {editing.mode === "new"
            ? "Post an opportunity"
            : `Editing ${editing.post.name}`}
        </h2>
        <OpportunityForm
          partner={partner}
          initial={
            editing.mode === "edit"
              ? valuesFromPost(editing.post)
              : EMPTY_OPPORTUNITY
          }
          submitLabel={editing.mode === "new" ? "Publish it" : "Save changes"}
          onSubmit={(values) =>
            editing.mode === "new"
              ? postOpportunity(values)
              : updateOpportunity(editing.post.id, values)
          }
          onCancel={() => setEditing(null)}
        />
      </section>
    );
  }

  return (
    <div className="space-y-8">
      <section>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold tracking-tight text-ink">
            What you&rsquo;ve posted
          </h2>
          {canPost && (
            <Button size="sm" onClick={() => setEditing({ mode: "new" })}>
              Post an opportunity
            </Button>
          )}
        </div>

        {posts.length === 0 ? (
          <div className="rounded-2xl border border-line bg-card p-6 shadow-card">
            <p className="text-base font-semibold text-ink">Nothing yet.</p>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-ink-soft">
              Post the next thing you run. It appears on students&rsquo; lists
              straight away with your logo on it, and it reaches the students
              whose year and subjects actually fit — not a feed everybody
              scrolls past.
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {posts.map((p) => (
              <PostRow
                key={p.id}
                post={p}
                canPost={canPost}
                onEdit={() => setEditing({ mode: "edit", post: p })}
              />
            ))}
          </ul>
        )}
      </section>

      <section>
        <button
          type="button"
          onClick={() => setShowProfile((s) => !s)}
          className="text-sm font-semibold text-ink underline-offset-2 hover:underline focus-visible:focus-ring"
        >
          {showProfile
            ? "Hide your public profile"
            : "Edit your public profile"}
        </button>
        {showProfile && <ProfileForm partner={partner} />}
      </section>
    </div>
  );
}

function PostRow({
  post,
  canPost,
  onEdit,
}: {
  post: PartnerPost;
  canPost: boolean;
  onEdit: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function toggle() {
    startTransition(async () => {
      const res = await setOpportunityPublished(post.id, !post.published);
      if (!res.ok) setError(res.error);
    });
  }

  return (
    <li className="rounded-2xl border border-line bg-card p-4 shadow-card">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="flex flex-wrap items-center gap-2">
            <span className="text-base font-semibold text-ink">
              {post.name}
            </span>
            {post.published ? (
              <span className="rounded-full bg-likely-soft px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-likely-ink">
                Live
              </span>
            ) : (
              <span className="rounded-full bg-surface px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-ink-faint">
                Taken down
              </span>
            )}
          </p>
          <p className="mt-1 text-sm text-ink-soft">
            {post.dateConfirmed ? (
              <>
                Closes{" "}
                <span data-num className="tabular-nums">
                  {formatDate(post.deadline)}
                </span>
              </>
            ) : post.alwaysOpen ? (
              "Runs continuously"
            ) : (
              "Dates not announced"
            )}
            {post.region && " · local"}
          </p>
        </div>

        <div className="flex shrink-0 flex-wrap gap-2">
          {canPost && (
            <Button size="sm" variant="tonal" onClick={onEdit}>
              Edit
            </Button>
          )}
          {canPost && (
            <Button
              size="sm"
              variant={post.published ? "danger" : "subtle"}
              onClick={toggle}
              disabled={pending}
            >
              {post.published ? "Take it down" : "Put it back up"}
            </Button>
          )}
        </div>
      </div>
      {error && (
        <p role="alert" className="mt-2 text-xs text-reach-ink">
          {error}
        </p>
      )}
    </li>
  );
}

function ProfileForm({ partner }: { partner: Partner }) {
  const [about, setAbout] = useState(partner.about);
  const [website, setWebsite] = useState(partner.website ?? "");
  const [logoUrl, setLogoUrl] = useState(partner.logoUrl ?? "");
  const [city, setCity] = useState(partner.city ?? "");
  const [contactEmail, setContactEmail] = useState(partner.contactEmail ?? "");
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function save() {
    startTransition(async () => {
      const res = await savePartnerProfile({
        about,
        website,
        logoUrl,
        city,
        contactEmail,
      });
      if (res.ok) {
        setMsg("Saved.");
        setError(null);
      } else {
        setError(res.error);
        setMsg(null);
      }
    });
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        save();
      }}
      className="mt-4 max-w-xl space-y-4 rounded-2xl border border-line bg-card p-5 shadow-card"
    >
      <Field
        label="About"
        hint="Two sentences on who you are. Shown on your public page."
      >
        <textarea
          value={about}
          onChange={(e) => setAbout(e.target.value.slice(0, 600))}
          rows={4}
          className="w-full rounded-xl border border-line bg-card px-3.5 py-2.5 text-[0.95rem] text-ink placeholder:text-ink-faint focus-visible:focus-ring"
        />
      </Field>
      <Field label="Website">
        <Input
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
          placeholder="https://"
        />
      </Field>
      <Field
        label="Logo URL"
        hint="An https:// link to your logo — square works best."
      >
        <Input
          value={logoUrl}
          onChange={(e) => setLogoUrl(e.target.value)}
          placeholder="https://"
        />
      </Field>
      <Field label="City">
        <Input value={city} onChange={(e) => setCity(e.target.value)} />
      </Field>
      <Field
        label="Contact email"
        hint="Only we see this — it is how we reach you."
      >
        <Input
          value={contactEmail}
          onChange={(e) => setContactEmail(e.target.value)}
        />
      </Field>

      <p className="text-xs text-ink-faint">
        Your organisation&rsquo;s name and country are fixed once you&rsquo;re
        verified — the tick says we checked <em>that</em> name. Ask us if either
        needs to change.
      </p>

      {error && (
        <p role="alert" className="text-sm text-reach-ink">
          {error}
        </p>
      )}
      {msg && <p className="text-sm text-ink-soft">{msg}</p>}

      <Button type="submit" size="sm" disabled={pending}>
        {pending ? "Saving…" : "Save profile"}
      </Button>
    </form>
  );
}

/** An existing row, back into the shape the form edits. */
function valuesFromPost(post: PartnerPost): OpportunityFormValues {
  return {
    name: post.name,
    url: post.url,
    blurb: post.blurb,
    category:
      (post.category as OpportunityFormValues["category"]) ?? "competition",
    tier: (post.tier as OpportunityFormValues["tier"]) ?? "accessible",
    level: (post.level as OpportunityFormValues["level"]) ?? "regional",
    fields:
      post.fields === "all"
        ? []
        : (post.fields as OpportunityFormValues["fields"]),
    eligibility: post.eligibility ?? "",
    timing: post.dateConfirmed
      ? "deadline"
      : post.alwaysOpen
        ? "always_open"
        : "tba",
    // A placeholder date is never shown back to the partner as if it were
    // theirs — an unconfirmed row starts the date field empty.
    deadline: post.dateConfirmed ? post.deadline : "",
    eventWindow: post.eventWindow,
    cost: (post.cost as OpportunityFormValues["cost"]) ?? "varies",
    costDetail: post.costDetail ?? "",
    scope: post.region ? "local" : "global",
    city: post.city ?? "",
  };
}
