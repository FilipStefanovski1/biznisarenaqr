import type { Metadata } from "next";
import { connection } from "next/server";
import QRCode from "qrcode";
import { Suspense } from "react";
import { getSiteUrl } from "@/lib/env";
import { fetchPublicState } from "@/lib/public-state";
import { ScreenApp } from "./ScreenApp";

export const metadata: Metadata = {
  title: "LED екран — Бизнис Арена 2026",
};

export default function ScreenPage() {
  return (
    <Suspense fallback={<div style={{ position: "fixed", inset: 0, background: "#0B1736" }} />}>
      <ScreenLoader />
    </Suspense>
  );
}

async function ScreenLoader() {
  await connection();
  const site = getSiteUrl();
  const qrSvg =
    site.ok && site.voteUrl
      ? await QRCode.toString(site.voteUrl, {
          type: "svg",
          margin: 4,
          errorCorrectionLevel: "M",
          color: { dark: "#0B1736", light: "#FFFFFF" },
        })
      : null;
  // The client reconciles immediately anyway; a failed initial read must not break the page.
  const initial = await fetchPublicState().catch(() => null);
  return <ScreenApp initial={initial} site={site} qrSvg={qrSvg} />;
}
