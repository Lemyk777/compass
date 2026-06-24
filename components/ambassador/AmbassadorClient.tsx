"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { shareUrl } from "@/lib/site";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/report/Section";
import { useT } from "@/lib/i18n/client";

export function AmbassadorClient({ code }: { code: string }) {
  const t = useT();
  const [link, setLink] = useState("");
  const [qr, setQr] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const url = `${shareUrl()}/?ref=${encodeURIComponent(code)}`;
    setLink(url);
    QRCode.toDataURL(url, {
      width: 320,
      margin: 1,
      color: { dark: "#10192b", light: "#ffffff" },
    })
      .then(setQr)
      .catch(() => setQr(null));
  }, [code]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  }

  return (
    <Card className="text-center">
      {qr ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={qr}
          alt={`QR code for referral link ${code}`}
          className="mx-auto h-44 w-44 rounded-xl border border-line"
        />
      ) : (
        <div className="mx-auto h-44 w-44 animate-pulse rounded-xl bg-line" />
      )}

      <p className="mt-4 text-xs font-medium uppercase tracking-wide text-ink-faint">
        {t("amb.referralLink")}
      </p>
      <p className="mt-1 break-all text-sm text-ink" data-num>
        {link || "…"}
      </p>

      <div className="mt-4 flex gap-2">
        <Button onClick={copy} className="flex-1">
          {copied ? t("amb.copied") : t("amb.copyLink")}
        </Button>
        <Button
          variant="subtle"
          onClick={() => {
            if (navigator.share) navigator.share({ url: link, title: "Join Compass" });
          }}
        >
          {t("amb.share")}
        </Button>
      </div>
    </Card>
  );
}
