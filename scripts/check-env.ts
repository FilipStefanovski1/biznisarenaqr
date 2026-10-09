/**
 * Validates deployment configuration. Run before deploying:
 *   npm run check:env -- --production
 * Fails (exit 1) on missing secrets or a QR URL that guests could not open.
 */
import { checkSiteUrl } from "../src/lib/site-url";
import { loadEnv } from "./load-env";

loadEnv();

const production = process.argv.includes("--production") || process.env.APP_ENV === "production" || process.env.VERCEL_ENV === "production";
const problems: string[] = [];
const notes: string[] = [];

for (const name of ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "SUPABASE_SECRET_KEY", "VOTER_COOKIE_SECRET", "PUBLIC_SITE_URL"]) {
  if (!process.env[name]) problems.push(`${name} is not set`);
}
if ((process.env.VOTER_COOKIE_SECRET ?? "").length < 32) problems.push("VOTER_COOKIE_SECRET must be at least 32 characters");
if (production && /local-dev-only/.test(process.env.VOTER_COOKIE_SECRET ?? "")) problems.push("VOTER_COOKIE_SECRET still has the local example value");

const publishable = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";
if (publishable.startsWith("sb_secret_") || /service_role/.test(Buffer.from(publishable.split(".")[1] ?? "", "base64").toString())) {
  problems.push("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY contains a SECRET/service-role key — it would be shipped to browsers");
}
for (const [k] of Object.entries(process.env)) {
  if (k.startsWith("NEXT_PUBLIC_") && /SECRET|SERVICE/.test(k)) problems.push(`${k}: secrets must never use the NEXT_PUBLIC_ prefix`);
}
if (production && /127\.0\.0\.1|localhost/.test(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "")) problems.push("NEXT_PUBLIC_SUPABASE_URL points at a local Supabase");

const site = checkSiteUrl(process.env.PUBLIC_SITE_URL, production);
if (!site.ok) problems.push(site.error ?? "PUBLIC_SITE_URL invalid");
else if (site.warning) notes.push(site.warning);

console.log(`Mode: ${production ? "PRODUCTION" : "development"}`);
if (site.voteUrl) console.log(`QR code will point to: ${site.voteUrl}`);
notes.forEach((n) => console.log(`! ${n}`));
if (problems.length) {
  problems.forEach((p) => console.error(`✗ ${p}`));
  process.exit(1);
}
console.log("✓ Environment looks good.");
