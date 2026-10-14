"use client";

import { useEffect, useState } from "react";
import { serverNow } from "@/lib/server-clock";

export type Countdown = {
  /** Milliseconds left (0 when over); null when the round has no timer or is not open. */
  remainingMs: number | null;
  /** Full timer length, for progress bars. */
  totalMs: number | null;
  expired: boolean;
};

/** Ticks ~4x per second against the server-corrected clock. */
export function useCountdown(opts: { open: boolean; openedAt?: string | null; closesAt?: string | null }): Countdown {
  const { open, openedAt, closesAt } = opts;
  const [now, setNow] = useState(() => serverNow());

  useEffect(() => {
    if (!open || !closesAt) return;
    const id = setInterval(() => setNow(serverNow()), 250);
    return () => clearInterval(id);
  }, [open, closesAt]);

  if (!open || !closesAt) return { remainingMs: null, totalMs: null, expired: false };
  const end = Date.parse(closesAt);
  const start = openedAt ? Date.parse(openedAt) : end;
  const remaining = Math.max(0, end - now);
  return { remainingMs: remaining, totalMs: Math.max(1, end - start), expired: remaining <= 0 };
}
