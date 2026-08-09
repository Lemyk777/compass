"use client";

import { useState, useTransition } from "react";
import type { Partner } from "@/lib/data/partners";
import type { PartnerPost } from "@/lib/partners/queries";
import {
  adminSetPostPublished,
  adminUpdatePartner,
  approvePartner,
  attachPartnerAccount,
  reactivatePartner,
  rejectPartner,
  setPartnerVerified,
  suspendPartner,
  type AdminPartnerResult,
} from "@/app/admin/partners/actions";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Input";
import { PartnerLogo, VerifiedTick } from "@/components/partners/PartnerBadge";
import { formatDate } from "@/lib/data/opportunity-format";

// One organisation, with every lever an admin has over it.
//
// The levers are deliberately separate rather than one "trusted" switch:
// listing an organisation, vouching that the account is really theirs, and
// stopping them posting are three different decisions, and collapsing them
// would make the verification mark mean "we like them" instead of "we checked".

export function PartnerAdmin({
  partner,
  posts,
}: {
  partner: Partner;
  posts: PartnerPost[];
}) {
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [showEdit, setShowEdit] = useState(false);

  function run(fn: () => Promise<AdminPartnerResult>) {
    startTransition(async () => {
      const res = await fn();
      setError(res.ok ? null : res.error);
    });
  }

  const live = posts.filter((p) => p.published).length;

  return (
    <div className="rounded-2xl border border-line bg-card p-5 shadow-card">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 gap-3">
          <PartnerLogo partner={partner} size="md" />
          <div className="min-w-0">
            <p className="flex flex-wrap items-center gap-1.5">
              <span className="text-base font-semibold text-ink">{partner.name}</span>
              {partner.verifiedAt && <VerifiedTick size="md" />}
              <StatusPill status={partner.status} />
            </p>
            <p className="mt-0.5 text-xs text-ink-faint">
              /partners/{partner.id}
              {partner.country ? ` · ${partner.country}` : " · no country set"}
              {partner.city ? ` · ${partner.city}` : ""}
              {` · ${live} live of ${posts.length}`}
            </p>
            <p className="mt-0.5 text-xs text-ink-faint">
              {partner.contactEmail ?? "no contact email"}
              {partner.userId ? "" : " · no account linked"}
              {partner.website ? (
                <>
                  {" · "}
                  <a
                    href={partner.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline decoration-line underline-offset-2 hover:decoration-ink"
                  >
                    website ↗
                  </a>
                </>
              ) : null}
            </p>
          </div>
        </div>
      </div>

      {partner.about && (
        <p className="mt-3 text-sm leading-relaxed text-ink-soft">{partner.about}</p>
      )}
      {partner.appliedNote && (
        <p className="mt-2 rounded-lg bg-surface px-3 py-2 text-xs leading-relaxed text-ink-soft">
          <span className="font-semibold text-ink">They wrote:</span>{" "}
          {partner.appliedNote}
        </p>
      )}
      {partner.reviewNote && (
        <p className="mt-2 text-xs text-ink-faint">Your note: {partner.reviewNote}</p>
      )}

      {/* ── Decisions ───────────────────────────────────────────────────── */}
      <div className="mt-4 space-y-3 border-t border-line pt-4">
        {partner.status === "pending" && (
          <>
            <Input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Note back to them (optional)"
              maxLength={300}
            />
            <div className="flex flex-wrap gap-2">
              <Button size="sm" disabled={pending} onClick={() => run(() => approvePartner(partner.id, note))}>
                Approve — they can post
              </Button>
              <Button
                size="sm"
                variant="tonal"
                disabled={pending}
                onClick={() => run(() => rejectPartner(partner.id, note))}
              >
                Reject
              </Button>
            </div>
          </>
        )}

        {(partner.status === "active" || partner.status === "suspended") && (
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant={partner.verifiedAt ? "tonal" : "primary"}
              disabled={pending}
              onClick={() => run(() => setPartnerVerified(partner.id, !partner.verifiedAt))}
            >
              {partner.verifiedAt ? "Remove the tick" : "Verify — the account is theirs"}
            </Button>
            {partner.status === "active" ? (
              <Button
                size="sm"
                variant="danger"
                disabled={pending}
                onClick={() => run(() => suspendPartner(partner.id, note))}
              >
                Suspend — hide everything they posted
              </Button>
            ) : (
              <Button
                size="sm"
                variant="subtle"
                disabled={pending}
                onClick={() => run(() => reactivatePartner(partner.id))}
              >
                Reactivate
              </Button>
            )}
            <Button size="sm" variant="ghost" onClick={() => setShowEdit((s) => !s)}>
              {showEdit ? "Close details" : "Edit details"}
            </Button>
          </div>
        )}

        {error && (
          <p role="alert" className="text-sm text-reach-ink">
            {error}
          </p>
        )}
      </div>

      {showEdit && <EditPanel partner={partner} />}

      {/* ── Their posts ─────────────────────────────────────────────────── */}
      {posts.length > 0 && (
        <div className="mt-4 border-t border-line pt-4">
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-faint">
            Posted
          </h4>
          <ul className="space-y-2">
            {posts.map((p) => (
              <AdminPostRow key={p.id} post={p} />
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function AdminPostRow({ post }: { post: PartnerPost }) {
  const [pending, startTransition] = useTransition();
  return (
    <li className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-surface px-3 py-2">
      <span className="min-w-0">
        <a
          href={post.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-medium text-ink underline decoration-line underline-offset-2 hover:decoration-ink"
        >
          {post.name}
        </a>
        <span className="ml-2 text-xs text-ink-faint">
          {post.dateConfirmed
            ? `closes ${formatDate(post.deadline)}`
            : post.alwaysOpen
              ? "always open"
              : "dates TBA"}
          {post.region ? ` · ${post.region}` : " · global"}
          {post.published ? "" : " · taken down"}
        </span>
      </span>
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            await adminSetPostPublished(post.id, !post.published);
          })
        }
        className="shrink-0 text-xs font-semibold text-ink-soft underline-offset-2 hover:text-ink hover:underline focus-visible:focus-ring"
      >
        {post.published ? "Take down" : "Restore"}
      </button>
    </li>
  );
}

function EditPanel({ partner }: { partner: Partner }) {
  const [name, setName] = useState(partner.name);
  const [country, setCountry] = useState(partner.country ?? "");
  const [city, setCity] = useState(partner.city ?? "");
  const [logoUrl, setLogoUrl] = useState(partner.logoUrl ?? "");
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function run(fn: () => Promise<AdminPartnerResult>, okMsg: string) {
    startTransition(async () => {
      const res = await fn();
      if (res.ok) {
        setMsg(okMsg);
        setError(null);
      } else {
        setError(res.error);
        setMsg(null);
      }
    });
  }

  return (
    <div className="mt-4 space-y-3 rounded-xl border border-line bg-surface p-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Name">
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field label="Country" hint="Free text — normalised to an ISO-2 code.">
          <Input value={country} onChange={(e) => setCountry(e.target.value)} placeholder="Kazakhstan" />
        </Field>
        <Field label="City">
          <Input value={city} onChange={(e) => setCity(e.target.value)} />
        </Field>
        <Field label="Logo" hint="https:// link, or a /public path we committed.">
          <Input value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} />
        </Field>
      </div>
      <Button
        size="sm"
        disabled={pending}
        onClick={() =>
          run(() => adminUpdatePartner(partner.id, { name, country, city, logoUrl }), "Saved.")
        }
      >
        Save details
      </Button>

      <div className="border-t border-line pt-3">
        <Field
          label="Link a different account"
          hint="The email of the Compass account that should post as this organisation."
        >
          <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="team@astanahub.com" />
        </Field>
        <Button
          size="sm"
          variant="tonal"
          className="mt-2"
          disabled={pending || !email}
          onClick={() => run(() => attachPartnerAccount(partner.id, email), "Account linked.")}
        >
          Link this account
        </Button>
      </div>

      {error && (
        <p role="alert" className="text-sm text-reach-ink">
          {error}
        </p>
      )}
      {msg && <p className="text-sm text-ink-soft">{msg}</p>}
    </div>
  );
}

function StatusPill({ status }: { status: Partner["status"] }) {
  const tone =
    status === "active"
      ? "bg-likely-soft text-likely-ink"
      : status === "pending"
        ? "bg-target-soft text-target-ink"
        : "bg-reach-soft text-reach-ink";
  return (
    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${tone}`}>
      {status}
    </span>
  );
}
