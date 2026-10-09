"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { getRealtimeClient } from "@/lib/supabase/browser";
import { isNewer, parseSnapshot, type Snapshot } from "@/lib/snapshot";

export type ConnectionState = "connecting" | "live" | "reconnecting";

type Options = {
  /** Max UI update rate during bursts. Totals stay exact: the newest snapshot always wins. */
  coalesceMs?: number;
  /** Poll interval while Realtime is not connected. */
  fallbackPollMs?: number;
  /** Background reconciliation interval while Realtime is healthy. */
  reconcileMs?: number;
};

/**
 * Live scoreboard state for /screen and /admin.
 * - Realtime broadcast (private `scoreboard` topic) delivers full aggregate snapshots.
 * - Snapshots are applied only if their version is newer (stale messages are dropped).
 * - On (re)subscribe, on reconnecting network and on tab focus an authoritative snapshot
 *   is fetched from /api/state?fresh=1.
 * - While Realtime is down, /api/state is polled every few seconds.
 */
export function useLiveScoreboard(initial: Snapshot | null, options: Options = {}) {
  const { coalesceMs = 120, fallbackPollMs = 3000, reconcileMs = 20000 } = options;
  const [snapshot, setSnapshot] = useState<Snapshot | null>(initial);
  const [connection, setConnection] = useState<ConnectionState>("connecting");

  const appliedRef = useRef<Snapshot | null>(initial);
  const pendingRef = useRef<Snapshot | null>(null);
  const flushTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastFlushRef = useRef(0);
  const lastFetchRef = useRef(0);
  const fetchingRef = useRef(false);
  const connectionRef = useRef<ConnectionState>("connecting");
  const trailingRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flush = useCallback(() => {
    flushTimerRef.current = null;
    const next = pendingRef.current;
    pendingRef.current = null;
    if (next && isNewer(appliedRef.current, next)) {
      appliedRef.current = next;
      lastFlushRef.current = Date.now();
      setSnapshot(next);
    }
  }, []);

  const offer = useCallback(
    (incoming: Snapshot | null) => {
      if (!incoming) return;
      const newest = pendingRef.current ?? appliedRef.current;
      if (!isNewer(newest, incoming)) return;
      pendingRef.current = incoming;
      // Round changes and status transitions are shown immediately; vote bursts coalesce.
      const applied = appliedRef.current;
      const urgent =
        !applied || applied.round?.id !== incoming.round?.id || applied.round?.status !== incoming.round?.status;
      const wait = urgent ? 0 : Math.max(0, coalesceMs - (Date.now() - lastFlushRef.current));
      if (wait === 0) {
        if (flushTimerRef.current) clearTimeout(flushTimerRef.current);
        flush();
      } else if (!flushTimerRef.current) {
        flushTimerRef.current = setTimeout(flush, wait);
      }
    },
    [coalesceMs, flush],
  );

  const fetchFresh = useCallback(async () => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;
    lastFetchRef.current = Date.now();
    try {
      const res = await fetch(`/api/state?fresh=1`, { cache: "no-store" });
      if (res.ok) offer(parseSnapshot(await res.json()));
    } catch {
      // Keep showing the last confirmed results; the poll loop retries.
    } finally {
      fetchingRef.current = false;
    }
  }, [offer]);

  useEffect(() => {
    const client = getRealtimeClient();
    let channel: RealtimeChannel | null = null;
    let disposed = false;
    let downSince: number | null = Date.now();

    const setConn = (next: ConnectionState) => {
      connectionRef.current = next;
      setConnection(next);
    };

    const subscribe = () => {
      channel = client
        .channel("scoreboard", { config: { private: true } })
        .on("broadcast", { event: "snapshot" }, ({ payload }) => {
          offer(parseSnapshot(payload));
          // After a burst settles, confirm against the server once. This covers messages
          // dropped by Realtime rate limits on smaller Supabase plans.
          if (trailingRef.current) clearTimeout(trailingRef.current);
          trailingRef.current = setTimeout(() => void fetchFresh(), 1500);
        })
        .subscribe((status) => {
          if (disposed) return;
          if (status === "SUBSCRIBED") {
            downSince = null;
            setConn("live");
            void fetchFresh(); // reconcile anything missed while disconnected
          } else {
            downSince ??= Date.now();
            setConn("reconnecting");
          }
        });
    };

    const resubscribe = () => {
      if (channel) void client.removeChannel(channel);
      channel = null;
      subscribe();
    };

    subscribe();
    void fetchFresh();

    const tick = setInterval(() => {
      const since = Date.now() - lastFetchRef.current;
      const live = connectionRef.current === "live";
      if ((!live && since >= fallbackPollMs) || (live && since >= reconcileMs)) void fetchFresh();
      // supabase-js retries joins itself; if a channel stays down, rebuild it.
      if (!live && downSince && Date.now() - downSince > 15000) {
        downSince = Date.now();
        resubscribe();
      }
    }, 1000);

    const onOnline = () => {
      void fetchFresh();
      if (connectionRef.current !== "live") resubscribe();
    };
    const onOffline = () => setConn("reconnecting");
    const onVisible = () => document.visibilityState === "visible" && void fetchFresh();
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      disposed = true;
      clearInterval(tick);
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
      document.removeEventListener("visibilitychange", onVisible);
      if (flushTimerRef.current) clearTimeout(flushTimerRef.current);
      if (trailingRef.current) clearTimeout(trailingRef.current);
      if (channel) void client.removeChannel(channel);
    };
  }, [fallbackPollMs, reconcileMs, fetchFresh, offer]);

  return { snapshot, connection, refresh: fetchFresh, offer };
}
