export type SiteUrlCheck = {
  /** Absolute URL of the public voting page encoded in the QR code. */
  voteUrl: string | null;
  /** Short human-readable form shown under the QR code, e.g. "glasaj.biznisarena.mk/vote". */
  displayUrl: string | null;
  /** false => the QR code must not be shown (production misconfiguration). */
  ok: boolean;
  /** Non-blocking notice for local/dev setups. */
  warning: string | null;
  error: string | null;
};

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "0.0.0.0", "::1", "[::1]"]);

function isPrivateHost(hostname: string): boolean {
  const host = hostname.toLowerCase();
  if (LOCAL_HOSTS.has(host) || host.endsWith(".localhost") || host.endsWith(".local")) return true;
  const m = host.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/);
  if (!m) return false;
  const [a, b] = [Number(m[1]), Number(m[2])];
  return a === 10 || a === 127 || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 169 && b === 254);
}

/**
 * Validates the configured public site URL.
 * In production the URL must be public HTTPS; localhost / private IPs / http are rejected.
 * Outside production they are allowed (e.g. a LAN IP for testing phones) but flagged.
 */
export function checkSiteUrl(raw: string | undefined, isProduction: boolean): SiteUrlCheck {
  const empty = { voteUrl: null, displayUrl: null };
  if (!raw || !raw.trim()) {
    return {
      ...empty,
      ok: false,
      warning: null,
      error: "PUBLIC_SITE_URL не е поставен. QR кодот не може да се генерира.",
    };
  }
  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    return { ...empty, ok: false, warning: null, error: `PUBLIC_SITE_URL не е валиден URL: ${raw}` };
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    return { ...empty, ok: false, warning: null, error: "PUBLIC_SITE_URL мора да започнува со https://" };
  }

  const base = `${url.protocol}//${url.host}${url.pathname.replace(/\/+$/, "")}`;
  const voteUrl = `${base}/vote`;
  const displayUrl = `${url.host}${url.pathname.replace(/\/+$/, "")}/vote`.replace(/^www\./, "");
  const local = isPrivateHost(url.hostname);
  const insecure = url.protocol !== "https:";

  if (isProduction && (local || insecure)) {
    return {
      voteUrl,
      displayUrl,
      ok: false,
      warning: null,
      error: local
        ? `PUBLIC_SITE_URL покажува кон локална адреса (${url.host}). Гостите не можат да ја отворат. Поставете јавен HTTPS домен.`
        : "PUBLIC_SITE_URL мора да користи HTTPS во продукција.",
    };
  }

  return {
    voteUrl,
    displayUrl,
    ok: true,
    warning: local
      ? `Локален URL (${url.host}) — работи само за уреди во истата мрежа. Не користете го на настанот.`
      : insecure
        ? "URL без HTTPS — само за тестирање."
        : null,
    error: null,
  };
}
