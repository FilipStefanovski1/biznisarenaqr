"use client";

import { useEffect } from "react";
import { parseSnapshot, type Snapshot } from "@/lib/snapshot";
import { useCountdown } from "@/lib/use-countdown";

/** At zero, asks the server to close the round (it refuses if the deadline has not passed). */
export function ExpireAtZero({
  openedAt,
  closesAt,
  onState,
}: {
  openedAt: string | null;
  closesAt: string;
  onState: (s: Snapshot | null) => void;
}) {
  const { expired } = useCountdown({ open: true, openedAt, closesAt });
  useEffect(() => {
    if (!expired) return;
    let stop = false;
    const fire = async () => {
      try {
        const res = await fetch("/api/round/expire", {
          method: "POST",
          cache: "no-store",
        });
        const body = (await res.json().catch(() => null)) as {
          state?: unknown;
        } | null;
        if (body?.state) onState(parseSnapshot(body.state));
      } catch {
        // retried below
      }
    };
    const first = setTimeout(fire, 400);
    const retry = setInterval(() => !stop && void fire(), 2000);
    return () => {
      stop = true;
      clearTimeout(first);
      clearInterval(retry);
    };
  }, [expired, onState]);
  return null;
}
