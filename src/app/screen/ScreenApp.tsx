"use client";

import confetti from "canvas-confetti";
import {
  animate,
  AnimatePresence,
  LayoutGroup,
  motion,
  MotionConfig,
  useReducedMotion,
} from "motion/react";
import { useEffect, useRef, useState } from "react";
import { AnimatedNumber } from "@/components/AnimatedNumber";
import { Expand } from "@/components/icons";
import { Logo } from "@/components/Logo";
import {
  formatNumber,
  formatPercentFor,
  MESSAGES,
  type Locale,
} from "@/i18n/messages";
import { computeStandings, type Standings } from "@/lib/results";
import type { SiteUrlCheck } from "@/lib/site-url";
import type { Snapshot } from "@/lib/snapshot";
import {
  useLiveScoreboard,
  type ConnectionState,
} from "@/lib/use-live-scoreboard";
import styles from "./screen.module.css";

type T = (typeof MESSAGES)[Locale];
const EASE = [0.16, 1, 0.3, 1] as const;

export function ScreenApp({
  initial,
  site,
  qrSvg,
}: {
  initial: Snapshot | null;
  site: SiteUrlCheck;
  qrSvg: string | null;
}) {
  const { snapshot, connection } = useLiveScoreboard(initial);
  const locale: Locale = snapshot?.screenLocale ?? "mk";
  const t = MESSAGES[locale];
  const round = snapshot?.round ?? null;
  const standings = computeStandings(snapshot);
  const status = round?.status ?? null;
  const closed = status === "closed";

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  // Kiosk behaviour: hide the cursor after a moment of no mouse movement.
  const stageRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const wake = () => {
      stageRef.current?.setAttribute("data-idle", "false");
      clearTimeout(timer);
      timer = setTimeout(() => stageRef.current?.setAttribute("data-idle", "true"), 2500);
    };
    wake();
    window.addEventListener("pointermove", wake);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("pointermove", wake);
    };
  }, []);

  return (
    <MotionConfig reducedMotion="user">
      <div
        ref={stageRef}
        className={`${styles.stage} app-surface`}
        data-testid="screen"
        data-status={status ?? "none"}
        data-version={snapshot?.version ?? 0}
        data-locale={locale}
      >
        <div className={styles.frame}>
          <header className={styles.top}>
            <div className={styles.logo}>
              <Logo priority />
            </div>
            <span className={styles.rule} aria-hidden />
            <Bug status={status} t={t} />
            <h1 className={styles.title}>{t.screenTitle}</h1>
            <div className={styles.topRight}>
              {round?.isRehearsal && (
                <span className={styles.rehearsal}>{t.rehearsal}</span>
              )}
            </div>
          </header>

          <AnimatePresence mode="wait" initial={false}>
            {closed ? (
              <motion.section
                key={`call-${round!.id}`}
                className={styles.call}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                <TheCall
                  standings={standings}
                  roundId={round!.id}
                  t={t}
                  locale={locale}
                />
              </motion.section>
            ) : (
              <motion.main
                key="board"
                className={styles.main}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, transition: { duration: 0.3 } }}
              >
                <Board
                  standings={standings}
                  t={t}
                  locale={locale}
                  roundId={round?.id ?? "none"}
                />
                <QrPanel site={site} qrSvg={qrSvg} t={t} />
              </motion.main>
            )}
          </AnimatePresence>

          <div className="wipe-in">
            <footer className={styles.ticker}>
              {closed ? (
                <FinalTicker standings={standings} locale={locale} />
              ) : (
                <>
                  <span className={styles.tickerLabel}>{t.totalVotes}</span>
                  <AnimatedNumber
                    value={standings.total}
                    format={(n) => formatNumber(n, locale)}
                    className={styles.tickerTotal}
                  />
                  <ConnectionStatus connection={connection} t={t} />
                </>
              )}
            </footer>
          </div>
        </div>
        <FullscreenButton label={t.fullscreen} />
      </div>
    </MotionConfig>
  );
}

function Bug({ status, t }: { status: string | null; t: T }) {
  if (status === "open") {
    return (
      <span
        className={`${styles.bug} ${styles.bugLive}`}
        data-testid="status-chip"
        data-state="open"
      >
        <span className={`${styles.bugDot} live-dot`} aria-hidden />
        {t.live}
      </span>
    );
  }
  if (status === "closed") {
    return (
      <span
        className={`${styles.bug} ${styles.bugFinal}`}
        data-testid="status-chip"
        data-state="closed"
      >
        {t.finalResults}
      </span>
    );
  }
  return (
    <span
      className={`${styles.bug} ${styles.bugSoon}`}
      data-testid="status-chip"
      data-state="waiting"
    >
      {t.statusSoon}
    </span>
  );
}

function Board({
  standings,
  t,
  locale,
  roundId,
}: {
  standings: Standings;
  t: T;
  locale: Locale;
  roundId: string;
}) {
  return (
    <section className={styles.board} aria-label={t.screenTitle}>
      <LayoutGroup>
        <ol className={styles.rows}>
          {standings.rows.map((row) => (
            <motion.li
              key={row.id}
              layout="position"
              transition={{ layout: { duration: 0.7, ease: EASE } }}
              className={`${styles.row} ${row.isLeader ? styles.rowLeader : ""}`}
              data-testid={`row-${row.id}`}
              data-votes={row.votes}
              data-leader={row.isLeader}
            >
              <span
                className={styles.tab}
                style={{ background: row.color }}
                aria-hidden
              />
              <div className={styles.rowBody}>
                <div className={styles.nameLine}>
                  <span className={styles.name}>{row.name}</span>
                  {row.isLeader &&
                    (standings.isTie ? (
                      <span className={`${styles.flag} ${styles.flagTie}`}>
                        {t.tie}
                      </span>
                    ) : (
                      <span className={styles.flag}>{t.leading}</span>
                    ))}
                </div>
                <div className={styles.track}>
                  <motion.div
                    className={styles.fill}
                    style={{ background: row.color }}
                    initial={false}
                    animate={{ width: `${row.percentage}%` }}
                    transition={{ duration: 0.9, ease: EASE }}
                  />
                </div>
              </div>
              <div className={styles.figures}>
                <span className={styles.count}>
                  <Delta value={row.votes} resetKey={roundId} />
                  <AnimatedNumber
                    value={row.votes}
                    format={(n) => formatNumber(n, locale)}
                  />
                </span>
                <AnimatedNumber
                  value={row.percentage}
                  format={(n) =>
                    formatPercentFor(Math.round(n * 10) / 10, locale)
                  }
                  className={styles.percent}
                />
              </div>
            </motion.li>
          ))}
        </ol>
      </LayoutGroup>
    </section>
  );
}

/** "+N" flash beside a count when real votes arrive. Driven imperatively: no re-render. */
function Delta({ value, resetKey }: { value: number; resetKey: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const prev = useRef({ value, key: resetKey });
  const reduce = useReducedMotion();

  useEffect(() => {
    const last = prev.current;
    prev.current = { value, key: resetKey };
    const node = ref.current;
    if (!node || reduce || last.key !== resetKey || value <= last.value) return;
    node.textContent = `+${value - last.value}`;
    const controls = animate(
      node,
      { opacity: [0, 1, 1, 0], x: [8, 0, 0, 0] },
      { duration: 2.2, times: [0, 0.1, 0.75, 1], ease: "easeOut" },
    );
    return () => controls.stop();
  }, [value, resetKey, reduce]);

  return <span ref={ref} className={styles.delta} aria-hidden />;
}

function QrPanel({
  site,
  qrSvg,
  t,
}: {
  site: SiteUrlCheck;
  qrSvg: string | null;
  t: T;
}) {
  if (!site.ok || !qrSvg) {
    return (
      <aside className={styles.qr}>
        <div className={styles.qrError} role="alert" data-testid="qr-error">
          {t.qrUnavailable}
          <br />
          {site.error}
        </div>
      </aside>
    );
  }
  return (
    <aside className={styles.qr} data-testid="qr-panel">
      <div className={styles.qrSlab}>
        <div className={styles.qrHead}>{t.scanToVote}</div>
        {/* SVG generated server-side by the qrcode library from PUBLIC_SITE_URL. */}
        <div
          className={styles.qrCode}
          dangerouslySetInnerHTML={{ __html: qrSvg }}
          data-testid="qr-code"
        />
        <div className={styles.qrUrl} data-testid="vote-url">
          {site.displayUrl}
        </div>
        <div className={styles.qrStrip} aria-hidden />
      </div>
      {site.warning && <div className={styles.qrWarning}>{site.warning}</div>}
    </aside>
  );
}

function fitSize(name: string, max: number, widthU: number): string {
  // Fira Sans Condensed ExtraBold caps average ~0.56em per character.
  const size = Math.min(max, widthU / Math.max(1, name.length * 0.58));
  return `calc(var(--u) * ${size.toFixed(2)})`;
}

function TheCall({
  standings,
  roundId,
  t,
  locale,
}: {
  standings: Standings;
  roundId: string;
  t: T;
  locale: Locale;
}) {
  const reduce = useReducedMotion();
  const firedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!standings.hasVotes || reduce || firedRef.current === roundId) return;
    firedRef.current = roundId;
    const colors = ["#D4AF37", "#E9CF76", "#F4F6FA"];
    const burst = (x: number, angle: number) =>
      confetti({
        particleCount: 40,
        spread: 62,
        startVelocity: 52,
        angle,
        origin: { x, y: 0.62 },
        colors,
        ticks: 210,
        gravity: 1.1,
        scalar: 0.95,
        shapes: ["square"],
        disableForReducedMotion: true,
      });
    const t1 = setTimeout(() => {
      burst(0.08, 62);
      burst(0.92, 118);
    }, 750);
    return () => {
      clearTimeout(t1);
    };
  }, [standings.hasVotes, roundId, reduce]);

  const wipe = {
    initial: { clipPath: "inset(0 100% 0 0)" },
    animate: { clipPath: "inset(0 0% 0 0)" },
    transition: { duration: 0.8, ease: EASE },
  };
  const rise = (delay: number) => ({
    initial: { y: "105%" },
    animate: { y: "0%" },
    transition: { duration: 0.8, delay, ease: EASE },
  });
  const fade = (delay: number) => ({
    initial: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6, delay, ease: EASE },
  });

  if (!standings.hasVotes) {
    return (
      <div data-testid="winner-none" style={{ width: "100%" }}>
        <motion.div style={{ width: "100%" }} {...wipe}>
          <div className={`${styles.band} ${styles.bandQuiet}`}>{t.closedTitle}</div>
        </motion.div>
        <motion.div className={styles.noVotes} {...fade(0.5)}>
          {t.noVotes}
        </motion.div>
      </div>
    );
  }

  if (standings.isTie) {
    // Tied winners share one size (set by the longest name) so neither looks bigger.
    const longest = standings.leaders.reduce(
      (a, l) => (l.name.length > a.length ? l.name : a),
      "",
    );
    const tieSize = fitSize(longest, 7, 86 / standings.leaders.length - 4);
    return (
      <div
        data-testid="winner-tie"
        style={{
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <motion.div style={{ width: "100%" }} {...wipe}>
          <div className={styles.band}>CONGRATULATIONS!</div>
        </motion.div>
        <div className={styles.tieList}>
          {standings.leaders.map((w, i) => (
            <div key={w.id} data-testid={`winner-${w.id}`}>
              <div className={styles.mask}>
                <motion.div
                  className={styles.winnerName}
                  style={{
                    fontSize: tieSize,
                    marginTop: 0,
                  }}
                  {...rise(0.6 + i * 0.12)}
                >
                  {w.name}
                </motion.div>
              </div>
              <motion.div
                className={styles.winnerStats}
                {...fade(0.9 + i * 0.12)}
              >
                {formatNumber(w.votes, locale)} {t.votes(w.votes)} ·{" "}
                {formatPercentFor(w.percentage, locale)}
              </motion.div>
            </div>
          ))}
        </div>
        <motion.div className={styles.tieBadge} {...fade(1.05)}>
          {t.tieWinners(standings.leaders.length)}
        </motion.div>
        <motion.div className={styles.winnerSub} {...fade(1.15)}>
          {t.winnersLabel}
        </motion.div>
      </div>
    );
  }

  const w = standings.leaders[0]!;
  return (
    <div
      data-testid={`winner-${w.id}`}
      style={{
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <motion.div style={{ width: "100%" }} {...wipe}>
        <div className={styles.band}>CONGRATULATIONS!</div>
      </motion.div>
      <div className={styles.mask}>
        <motion.div
          className={styles.winnerName}
          style={{ fontSize: fitSize(w.name, 12, 84) }}
          data-testid="winner-name"
          {...rise(0.45)}
        >
          {w.name}
        </motion.div>
      </div>
      <motion.div className={styles.winnerSub} {...fade(0.85)}>
        {t.winnerLabel}
      </motion.div>
      <motion.div
        className={styles.winnerStats}
        data-testid="winner-stats"
        {...fade(1)}
      >
        {formatNumber(w.votes, locale)} {t.votes(w.votes)} ·{" "}
        {formatPercentFor(w.percentage, locale)}
      </motion.div>
    </div>
  );
}

function FinalTicker({
  standings,
  locale,
}: {
  standings: Standings;
  locale: Locale;
}) {
  return (
    <div className={styles.finals} data-testid="final-table">
      {standings.rows.map((row) => (
        <div key={row.id} className={styles.final}>
          <span
            className={styles.finalTab}
            style={{ background: row.color }}
            aria-hidden
          />
          {standings.hasVotes && row.isLeader ? (
            <span className={styles.finalWinner}>{row.rank}</span>
          ) : (
            <span className={styles.finalNum} style={{ marginLeft: 0 }}>
              {standings.hasVotes ? row.rank : ""}
            </span>
          )}
          <span className={styles.finalName}>{row.name}</span>
          <span className={styles.finalNum}>
            {formatNumber(row.votes, locale)} ·{" "}
            {formatPercentFor(row.percentage, locale)}
          </span>
        </div>
      ))}
    </div>
  );
}

function ConnectionStatus({
  connection,
  t,
}: {
  connection: ConnectionState;
  t: T;
}) {
  const live = connection === "live";
  return (
    <span
      className={`${styles.tickerStatus} ${live ? "" : styles.reconnecting}`}
      role="status"
      data-testid="connection"
      data-connection={connection}
    >
      {live ? (
        <span className={`${styles.statusDot} live-dot`} aria-hidden />
      ) : (
        <span
          className="spinner"
          style={{
            width: "1em",
            height: "1em",
            borderRadius: 999,
            border: "2px solid rgba(180,83,9,.3)",
            borderTopColor: "#b45309",
          }}
          aria-hidden
        />
      )}
      {live
        ? t.liveUpdating
        : connection === "connecting"
          ? t.connecting
          : t.reconnecting}
    </span>
  );
}

function FullscreenButton({ label }: { label: string }) {
  const [isFullscreen, setIsFullscreen] = useState(true);
  useEffect(() => {
    const update = () => setIsFullscreen(Boolean(document.fullscreenElement));
    update();
    document.addEventListener("fullscreenchange", update);
    return () => document.removeEventListener("fullscreenchange", update);
  }, []);
  if (isFullscreen) return null;
  return (
    <button
      type="button"
      className={styles.fullscreenButton}
      onClick={() =>
        void document.documentElement
          .requestFullscreen?.()
          .catch(() => undefined)
      }
      data-testid="fullscreen-button"
    >
      <Expand className="h-4 w-4" />
      {label}
    </button>
  );
}
