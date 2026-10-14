"use client";

/**
 * Countdowns must agree on every device even when a laptop or phone clock is wrong.
 * We keep an offset between the database clock (serverTime in snapshots) and Date.now(),
 * learned only from fresh, uncached HTTP responses.
 */
let offsetMs = 0;
let learned = false;

/**
 * Learn from a direct HTTP response only (never from Realtime, which can arrive late).
 * Pass the local send/receive times to use the round-trip midpoint (NTP-style).
 */
export function learnServerTime(serverTime: string | undefined, sentAt?: number, receivedAt?: number) {
  if (!serverTime) return;
  const server = Date.parse(serverTime);
  if (Number.isNaN(server)) return;
  const local = sentAt !== undefined && receivedAt !== undefined ? (sentAt + receivedAt) / 2 : Date.now();
  const next = server - local;
  // Smooth small jitter; jump immediately on the first sample or a large correction.
  offsetMs = !learned || Math.abs(next - offsetMs) > 2000 ? next : offsetMs * 0.7 + next * 0.3;
  learned = true;
}

export function serverNow(): number {
  return Date.now() + offsetMs;
}

/** "1:05", "0:09" */
export function formatClock(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
}
