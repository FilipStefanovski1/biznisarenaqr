import "server-only";
import { checkSiteUrl, type SiteUrlCheck } from "@/lib/site-url";

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable ${name}. See .env.example.`);
  return value;
}

/** True on the real event deployment. Set APP_ENV=production on the production host. */
export function isProductionDeployment(): boolean {
  return process.env.VERCEL_ENV === "production" || process.env.APP_ENV === "production";
}

export const serverEnv = {
  supabaseUrl: () => required("NEXT_PUBLIC_SUPABASE_URL"),
  supabasePublishableKey: () => required("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"),
  /** Secret/service-role key. Server only; never prefixed with NEXT_PUBLIC_. */
  supabaseSecretKey: () => required("SUPABASE_SECRET_KEY"),
  voterCookieSecret: () => {
    const value = required("VOTER_COOKIE_SECRET");
    if (value.length < 32) throw new Error("VOTER_COOKIE_SECRET must be at least 32 characters.");
    return value;
  },
  /** Votes allowed per client network per minute. Generous: a whole venue shares one IP. */
  voteRateLimitPerMinute: () => {
    const n = Number(process.env.VOTE_RATE_LIMIT_PER_MINUTE ?? "1500");
    return Number.isFinite(n) && n >= 0 ? Math.floor(n) : 1500;
  },
};

export function getSiteUrl(): SiteUrlCheck {
  return checkSiteUrl(process.env.PUBLIC_SITE_URL, isProductionDeployment());
}
