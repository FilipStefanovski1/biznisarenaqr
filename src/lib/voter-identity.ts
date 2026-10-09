import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";

/**
 * Anonymous voter identity: a random UUID stored in an httpOnly cookie and signed with
 * HMAC-SHA256 so it cannot be forged or edited client-side. The database enforces one
 * vote per (round, voter_id). This stops ordinary repeat voting from the same browser;
 * it cannot stop someone using several browsers or clearing site data (see README).
 */
export const VOTER_COOKIE = "ba_voter";
export const VOTER_COOKIE_MAX_AGE = 60 * 60 * 24 * 180;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

function sign(value: string, secret: string): string {
  return createHmac("sha256", secret).update(`voter:${value}`).digest("base64url");
}

export function createVoterToken(secret: string, voterId: string = randomUUID()): { voterId: string; token: string } {
  return { voterId, token: `${voterId}.${sign(voterId, secret)}` };
}

export function verifyVoterToken(token: string | undefined | null, secret: string): string | null {
  if (!token || token.length > 200) return null;
  const dot = token.indexOf(".");
  if (dot <= 0) return null;
  const voterId = token.slice(0, dot);
  const signature = token.slice(dot + 1);
  if (!UUID_RE.test(voterId)) return null;
  const expected = Buffer.from(sign(voterId, secret));
  const actual = Buffer.from(signature);
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null;
  return voterId;
}

/** Non-reversible network fingerprint used only for the generous abuse limiter. */
export function clientHash(ip: string | null, secret: string): string | null {
  if (!ip) return null;
  return createHmac("sha256", secret).update(`ip:${ip}`).digest("base64url").slice(0, 32);
}
