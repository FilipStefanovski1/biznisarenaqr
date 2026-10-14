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
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { AnimatedNumber } from "@/components/AnimatedNumber";
import { Expand, SpeakerOff, SpeakerOn } from "@/components/icons";
import { Logo } from "@/components/Logo";
import { TeamLogo } from "@/components/TeamLogo";
import {
  formatNumber,
  formatPercentFor,
  MESSAGES,
  type Locale,
} from "@/i18n/messages";
import { computeStandings, type Standings } from "@/lib/results";
import type { SiteUrlCheck } from "@/lib/site-url";
import { ArenaSound, type Urgency } from "@/lib/arena-sound";
import { formatClock } from "@/lib/server-clock";
import type { Snapshot } from "@/lib/snapshot";
import { useCountdown } from "@/lib/use-countdown";
import { ExpireAtZero } from "@/components/ExpireAtZero";
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
  const { snapshot, connection, offer } = useLiveScoreboard(initial);
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
      timer = setTimeout(
        () => stageRef.current?.setAttribute("data-idle", "true"),
        2500,
      );
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
              {status === "open" && round?.closesAt && (
                <ClockSlab
                  openedAt={round.openedAt}
                  closesAt={round.closesAt}
                  t={t}
                />
              )}
            </div>
            {status === "open" && round?.closesAt && (
              <TimerBar openedAt={round.openedAt} closesAt={round.closesAt} />
            )}
          </header>
          {status === "open" && round?.closesAt && (
            <ExpireAtZero
              key={`${round.id}:${round.closesAt}`}
              openedAt={round.openedAt}
              closesAt={round.closesAt}
              onState={offer}
            />
          )}
          <SoundDirector
            status={status}
            roundId={round?.id ?? null}
            openedAt={round?.openedAt ?? null}
            closesAt={round?.closesAt ?? null}
            hasVotes={standings.hasVotes}
            label={{ on: t.soundOn, off: t.soundOff }}
          />

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
              <div className={styles.rowLogo}>
                <TeamLogo
                  contestant={row}
                  className={styles.logoTile}
                  priority
                  sizes="240px"
                />
              </div>
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
          <div className={`${styles.band} ${styles.bandQuiet}`}>
            {t.closedTitle}
          </div>
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
            <div
              key={w.id}
              data-testid={`winner-${w.id}`}
              className={styles.tieWinner}
            >
              <motion.div {...fade(0.5 + i * 0.12)}>
                <TeamLogo
                  contestant={w}
                  className={styles.tieLogo}
                  sizes="320px"
                />
              </motion.div>
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
      <div className={styles.winnerLine}>
        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.35, ease: EASE }}
        >
          <TeamLogo
            contestant={w}
            className={styles.winnerLogo}
            priority
            sizes="420px"
          />
        </motion.div>
        <div className={styles.mask}>
          <motion.div
            className={styles.winnerName}
            style={{ fontSize: fitSize(w.name, 11, 64), marginTop: 0 }}
            data-testid="winner-name"
            {...rise(0.45)}
          >
            {w.name}
          </motion.div>
        </div>
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

/* ------------------------------------------------------------------ timer */

function ClockSlab({
  openedAt,
  closesAt,
  t,
}: {
  openedAt: string | null;
  closesAt: string;
  t: T;
}) {
  const { remainingMs } = useCountdown({ open: true, openedAt, closesAt });
  const ms = remainingMs ?? 0;
  const urgent = ms <= 10_000;
  const over = ms <= 0;
  return (
    <div
      className={`${styles.clock} ${urgent ? styles.clockUrgent : ""}`}
      data-testid="screen-timer"
      data-remaining={Math.ceil(ms / 1000)}
      role="timer"
      aria-live="off"
    >
      <span className={styles.clockLabel}>{over ? t.timeUp : t.timeLeft}</span>
      {!over && (
        <span
          key={urgent ? Math.ceil(ms / 1000) : "steady"}
          className={`${styles.clockValue} ${urgent ? styles.clockPulse : ""}`}
        >
          {formatClock(ms)}
        </span>
      )}
    </div>
  );
}

function TimerBar({
  openedAt,
  closesAt,
}: {
  openedAt: string | null;
  closesAt: string;
}) {
  const { remainingMs, totalMs } = useCountdown({
    open: true,
    openedAt,
    closesAt,
  });
  const pct = totalMs
    ? Math.max(0, Math.min(1, (remainingMs ?? 0) / totalMs))
    : 0;
  return (
    <div className={styles.timerTrack} aria-hidden>
      <div
        className={`${styles.timerFill} ${(remainingMs ?? 0) <= 10_000 ? styles.timerFillUrgent : ""}`}
        style={{ transform: `scaleX(${pct})` }}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ sound */

const SOUND_KEY = "ba_screen_sound";
const soundListeners = new Set<() => void>();
function readSoundPref(): boolean {
  try {
    return window.localStorage.getItem(SOUND_KEY) !== "off";
  } catch {
    return true;
  }
}
function writeSoundPref(on: boolean) {
  try {
    window.localStorage.setItem(SOUND_KEY, on ? "on" : "off");
  } catch {
    // private mode: keep it for this session only
  }
  soundListeners.forEach((l) => l());
}
function subscribeSoundPref(listener: () => void) {
  soundListeners.add(listener);
  return () => soundListeners.delete(listener);
}

function SoundDirector({
  status,
  roundId,
  openedAt,
  closesAt,
  hasVotes,
  label,
}: {
  status: string | null;
  roundId: string | null;
  openedAt: string | null;
  closesAt: string | null;
  hasVotes: boolean;
  label: { on: string; off: string };
}) {
  const engine = useRef<ArenaSound | null>(null);
  const enabled = useSyncExternalStore(
    subscribeSoundPref,
    readSoundPref,
    () => true,
  );
  const [unlocked, setUnlocked] = useState(false);
  const { remainingMs } = useCountdown({
    open: status === "open",
    openedAt,
    closesAt,
  });
  const lastSecond = useRef<number | null>(null);
  const prevStatus = useRef<{
    id: string | null;
    status: string | null;
  } | null>(null);
  const timeUpFor = useRef<string | null>(null);

  // Restore the operator's choice; unlock audio on the first click/key anywhere.
  useEffect(() => {
    engine.current = new ArenaSound();
    const unlock = () =>
      void engine.current?.unlock().then((ok) => ok && setUnlocked(true));
    window.addEventListener("pointerdown", unlock);
    window.addEventListener("keydown", unlock);
    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
      engine.current?.dispose();
      engine.current = null;
    };
  }, []);

  useEffect(() => {
    engine.current?.setEnabled(enabled);
  }, [enabled, unlocked]);

  // Music while voting is open.
  const playing = unlocked && status === "open";
  useEffect(() => {
    const e = engine.current;
    if (!e) return;
    if (playing) e.startMusic();
    else e.stopMusic();
  }, [playing]);

  // Build-up, final-second ticks and the "time's up" hit.
  useEffect(() => {
    const e = engine.current;
    if (!e || !unlocked || remainingMs === null) return;
    const urgency: Urgency =
      remainingMs <= 10_000 ? 2 : remainingMs <= 30_000 ? 1 : 0;
    e.setUrgency(urgency);
    const sec = Math.ceil(remainingMs / 1000);
    if (sec !== lastSecond.current) {
      lastSecond.current = sec;
      if (sec >= 1 && sec <= 10) e.tick(sec);
      if (sec === 0 && roundId && timeUpFor.current !== roundId) {
        timeUpFor.current = roundId;
        e.timeUp();
      }
    }
  }, [remainingMs, unlocked, roundId]);

  // Fanfare when this round goes from open to closed while the screen is watching.
  useEffect(() => {
    const prev = prevStatus.current;
    prevStatus.current = { id: roundId, status };
    if (!unlocked || !prev || prev.id !== roundId) return;
    if (prev.status === "open" && status === "closed" && hasVotes) {
      const id = setTimeout(
        () => engine.current?.fanfare(),
        timeUpFor.current === roundId ? 900 : 350,
      );
      return () => clearTimeout(id);
    }
    if (status !== "open") engine.current?.setUrgency(0);
  }, [status, roundId, hasVotes, unlocked]);

  const toggle = () => {
    writeSoundPref(!enabled);
    void engine.current?.unlock().then((ok) => ok && setUnlocked(true));
  };

  return (
    <button
      type="button"
      onClick={toggle}
      className={`${styles.soundButton} ${enabled && !unlocked ? styles.soundButtonPrompt : ""}`}
      data-testid="sound-toggle"
      data-enabled={enabled}
      data-unlocked={unlocked}
      aria-pressed={enabled}
    >
      {enabled ? (
        <SpeakerOn className="h-4 w-4" />
      ) : (
        <SpeakerOff className="h-4 w-4" />
      )}
      {enabled ? label.on : label.off}
    </button>
  );
}
