import QRCode from "qrcode";
import { connection, type NextRequest } from "next/server";
import { getSiteUrl } from "@/lib/env";
import { json } from "@/lib/http";

/** QR code for the public /vote URL (from PUBLIC_SITE_URL), with a 4-module quiet zone. */
export async function GET(request: NextRequest) {
  await connection();
  const site = getSiteUrl();
  if (!site.ok || !site.voteUrl) {
    return json({ code: "invalid_site_url", error: site.error }, { status: 503 });
  }
  const format = request.nextUrl.searchParams.get("format") === "png" ? "png" : "svg";
  const download = request.nextUrl.searchParams.has("download");
  const options = { errorCorrectionLevel: "M" as const, margin: 4, color: { dark: "#0B1736", light: "#FFFFFF" } };
  const headers: Record<string, string> = { "Cache-Control": "no-store", "X-Vote-Url": site.voteUrl };
  if (download) headers["Content-Disposition"] = `attachment; filename="biznis-arena-glasanje-qr.${format}"`;

  if (format === "png") {
    const png = await QRCode.toBuffer(site.voteUrl, { ...options, type: "png", width: 1200 });
    return new Response(new Uint8Array(png), { headers: { ...headers, "Content-Type": "image/png" } });
  }
  const svg = await QRCode.toString(site.voteUrl, { ...options, type: "svg" });
  return new Response(svg, { headers: { ...headers, "Content-Type": "image/svg+xml; charset=utf-8" } });
}
