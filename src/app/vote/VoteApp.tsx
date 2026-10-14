"use client";

import { AnimatePresence, motion, MotionConfig } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  CONTESTANTS,
  getContestant,
  type Contestant,
} from "@/config/contestants";
import { ArrowRight, Check, Lock } from "@/components/icons";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { Logo } from "@/components/Logo";
import { TeamLogo } from "@/components/TeamLogo";
import {
  formatNumber,
  formatPercentFor,
  type Locale,
  MESSAGES,
} from "@/i18n/messages";
import { useGuestLocale } from "@/i18n/use-locale";
import { formatClock, learnServerTime, serverNow } from "@/lib/server-clock";
import { useCountdown } from "@/lib/use-countdown";
import { computeStandings } from "@/lib/results";
import {
  isNewer,
  parseSnapshot,
  voterStateSchema,
  type MyVote,
  type Snapshot,
  type VoterState,
} from "@/lib/snapshot";

type SubmitError = "network" | "rate_limited" | "server" | "invalid" | null;
type T = (typeof MESSAGES)[Locale];

const REQUEST_TIMEOUT_MS = 10000;
const EASE = [0.16, 1, 0.3, 1] as const;

async function fetchWithTimeout(
  input: string,
  init?: RequestInit,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    return await fetch(input, {
      ...init,
      signal: controller.signal,
      cache: "no-store",
    });
  } finally {
    clearTimeout(timer);
  }
}

async function fetchVoterState(): Promise<VoterState | null> {
  try {
    const sentAt = Date.now();
    const res = await fetchWithTimeout("/api/vote");
    const receivedAt = Date.now();
    if (!res.ok) return null;
    const parsed = voterStateSchema.safeParse(await res.json());
    if (parsed.success)
      learnServerTime(parsed.data.state.serverTime, sentAt, receivedAt);
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

/** Light haptic feedback where the platform supports it (Android); silent elsewhere. */
function haptic(pattern: number | number[]) {
  try {
    navigator.vibrate?.(pattern);
  } catch {
    // ignore
  }
}

function clockTime(iso: string | undefined): string {
  const d = iso ? new Date(iso) : new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export function VoteApp() {
  const { locale, t, setLocale } = useGuestLocale();
  const [state, setState] = useState<Snapshot | null>(null);
  const [myVote, setMyVote] = useState<MyVote>(null);
  const [loadError, setLoadError] = useState(false);
  const [pending, setPending] = useState<Contestant | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<SubmitError>(null);
  const submittingRef = useRef(false);
  const stateRef = useRef<Snapshot | null>(null);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const applyState = useCallback((next: Snapshot | null) => {
    if (!next || !isNewer(stateRef.current, next)) return;
    stateRef.current = next;
    setState(next);
  }, []);

  const applyVoter = useCallback((voter: VoterState | null) => {
    if (!voter) {
      setLoadError(true);
      return false;
    }
    stateRef.current = voter.state;
    setState(voter.state);
    setMyVote(voter.myVote);
    setLoadError(false);
    return true;
  }, []);

  /** Loads (or mints) the voter identity and restores an accepted vote from the backend. */
  const loadVoter = useCallback(
    async () => applyVoter(await fetchVoterState()),
    [applyVoter],
  );

  useEffect(() => {
    void fetchVoterState().then(applyVoter);
  }, [applyVoter]);

  // Lightweight polling of the public (briefly CDN-cached) state to pick up open/close
  // transitions. Phones intentionally do not hold Realtime connections.
  const status = state?.round?.status;
  const hasVoted = Boolean(
    myVote && state?.round && myVote.roundId === state.round.id,
  );
  const loaded = state !== null;
  const closesAt = status === "open" ? (state?.round?.closesAt ?? null) : null;
  const [expiredFor, setExpiredFor] = useState<string | null>(null);
  const timeOver = closesAt !== null && expiredFor === closesAt;
  useEffect(() => {
    if (!closesAt) return;
    const wait = Date.parse(closesAt) - serverNow();
    const id = setTimeout(() => setExpiredFor(closesAt), Math.max(0, wait));
    return () => clearTimeout(id);
  }, [closesAt]);

  useEffect(() => {
    if (!loaded) return;
    const interval =
      status === "waiting"
        ? 3000
        : status === "closed"
          ? 8000
          : timeOver
            ? 2000
            : 5000;
    const timer = setInterval(async () => {
      try {
        const res = await fetchWithTimeout("/api/state");
        if (!res.ok) return;
        const next = parseSnapshot(await res.json());
        if (!next) return;
        if (
          next.round?.id !== stateRef.current?.round?.id &&
          isNewer(stateRef.current, next)
        ) {
          // A fresh round started: reload this voter's state for the new round.
          setPending(null);
          setSubmitError(null);
          await loadVoter();
          return;
        }
        applyState(next);
      } catch {
        // Ignore; next tick retries.
      }
    }, interval);
    return () => clearInterval(timer);
  }, [loaded, status, timeOver, applyState, loadVoter]);

  // If voting closes while the confirmation sheet is open, the sheet goes away.
  const sheetOpen =
    pending !== null && status === "open" && !hasVoted && !timeOver;

  const submit = useCallback(async () => {
    const round = stateRef.current?.round;
    const choice = pending;
    if (submittingRef.current || !choice || !round) return;
    submittingRef.current = true;
    setSubmitting(true);
    setSubmitError(null);
    const send = () =>
      fetchWithTimeout("/api/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roundId: round.id, contestantId: choice.id }),
      });
    try {
      let res = await send();
      if (res.status === 401) {
        // Identity cookie missing (e.g. blocked/cleared): obtain one and retry once.
        await loadVoter();
        res = await send();
      }
      const body = (await res.json().catch(() => null)) as {
        ok?: boolean;
        code?: string;
        roundId?: string;
        contestantId?: string;
        state?: unknown;
      } | null;

      if (res.ok && body?.ok && body.roundId && body.contestantId) {
        // Success is shown only after the server confirmed the vote.
        haptic([14, 60, 28]);
        setMyVote({
          roundId: body.roundId,
          contestantId: body.contestantId,
          createdAt: new Date().toISOString(),
        });
        setPending(null);
        return;
      }
      if (body?.state) applyState(parseSnapshot(body.state));
      if (body?.code === "round_not_active") {
        setPending(null);
        await loadVoter();
        return;
      }
      if (body?.code === "not_open") {
        setPending(null); // the state applied above now shows waiting/closed
        return;
      }
      if (res.status === 429) setSubmitError("rate_limited");
      else if (res.status === 400) setSubmitError("invalid");
      else setSubmitError("server");
    } catch {
      // Timeout or network failure: the vote may or may not have been stored. Retrying is
      // safe because the server is idempotent per voter and round.
      setSubmitError("network");
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  }, [pending, applyState, loadVoter]);

  const closeSheet = useCallback(() => {
    if (submittingRef.current) return;
    setPending(null);
    setSubmitError(null);
  }, []);

  const round = state?.round ?? null;

  const view = !state
    ? loadError
      ? "failed"
      : "splash"
    : !round
      ? "waiting"
      : round.status === "closed"
        ? "closed"
        : hasVoted
          ? "receipt"
          : round.status === "waiting"
            ? "waiting"
            : timeOver
              ? "timeup"
              : "ballot";

  return (
    <MotionConfig reducedMotion="user">
      <div className="app-surface fixed inset-0 flex items-center justify-center bg-navy-950">
        <div className="device relative flex h-full w-full flex-col overflow-hidden bg-navy sm:h-[min(880px,calc(100dvh-48px))] sm:max-w-[420px] sm:rounded-[28px] sm:shadow-[0_30px_80px_rgba(0,0,0,0.55)] sm:ring-1 sm:ring-white/10">
          <main
            className="flex min-h-0 flex-1 flex-col px-5 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1.25rem,env(safe-area-inset-bottom))]"
            inert={sheetOpen}
          >
            <header className="flex shrink-0 items-center gap-3">
              <div className="h-9 shrink-0">
                <Logo priority />
              </div>
              {round && <StatusBug status={round.status} t={t} />}
              {closesAt && !hasVoted && !timeOver && (
                <PhoneTimer
                  openedAt={round?.openedAt ?? null}
                  closesAt={closesAt}
                />
              )}
              <div className="ml-auto">
                <LanguageSwitcher
                  locale={locale}
                  label={t.language}
                  onChange={setLocale}
                />
              </div>
            </header>
            {round?.isRehearsal && (
              <div className="mt-3 border-y border-white/25 py-1.5 text-center font-display text-[13px] font-bold tracking-[0.24em] text-white">
                {t.rehearsal}
              </div>
            )}

            <div
              className="relative flex min-h-0 flex-1 flex-col pt-7"
              aria-live="polite"
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={view}
                  className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain"
                  initial={{ opacity: 0, x: 28 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -28 }}
                  transition={{ duration: 0.32, ease: EASE }}
                >
                  {view === "splash" && <Loading t={t} />}
                  {view === "failed" && (
                    <LoadFailed t={t} onRetry={() => void loadVoter()} />
                  )}
                  {state &&
                    view !== "splash" &&
                    view !== "failed" &&
                    renderBody()}
                </motion.div>
              </AnimatePresence>
            </div>
          </main>

          <AnimatePresence>
            {sheetOpen && pending && (
              <ConfirmSheet
                key="confirm"
                contestant={pending}
                t={t}
                submitting={submitting}
                error={submitError}
                onConfirm={() => void submit()}
                onBack={closeSheet}
              />
            )}
          </AnimatePresence>
        </div>
      </div>
    </MotionConfig>
  );

  function renderBody() {
    if (!round) return <Waiting t={t} />;
    if (round.status === "closed")
      return (
        <Closed
          snapshot={state!}
          myVote={hasVoted ? myVote : null}
          t={t}
          locale={locale}
        />
      );
    if (hasVoted) return <Receipt vote={myVote!} t={t} />;
    if (round.status === "waiting") return <Waiting t={t} />;
    if (timeOver) return <TimeUp t={t} />;
    return (
      <Ballot
        t={t}
        onPick={(c) => {
          if (submittingRef.current) return;
          haptic(10);
          setPending(c);
        }}
      />
    );
  }
}

function StatusBug({
  status,
  t,
}: {
  status: "waiting" | "open" | "closed";
  t: T;
}) {
  if (status === "open") {
    return (
      <span className="chamfer-r flex h-7 items-center gap-1.5 bg-blue pr-4 pl-2.5 font-display text-[13px] font-bold tracking-[0.12em] text-navy uppercase">
        <span className="live-dot h-2 w-2 rounded-full bg-navy" aria-hidden />
        {t.live}
      </span>
    );
  }
  return (
    <span className="flex h-7 items-center px-2.5 font-display text-[13px] font-semibold tracking-[0.12em] text-muted uppercase ring-1 ring-white/15">
      {status === "waiting" ? t.statusSoon : t.statusClosed}
    </span>
  );
}

function Loading({ t }: { t: T }) {
  return (
    <div
      className="flex flex-1 flex-col items-center justify-center gap-6 pb-16"
      role="status"
    >
      <div className="h-20">
        <Logo />
      </div>
      <div className="h-[3px] w-28 overflow-hidden bg-white/10" aria-hidden>
        <div className="splash-bar h-full w-1/3 bg-blue" />
      </div>
      <span className="sr-only">{t.loading}</span>
    </div>
  );
}

function LoadFailed({ t, onRetry }: { t: T; onRetry: () => void }) {
  return (
    <div className="flex flex-1 flex-col justify-center" role="alert">
      <h1 className="font-display text-[36px] leading-none font-extrabold uppercase">
        {t.offlineTitle}
      </h1>
      <p className="mt-3 text-[17px] text-ink-2">{t.offlineBody}</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-8 h-14 w-full rounded-[3px] bg-mist font-display text-[20px] font-bold tracking-[0.04em] text-navy uppercase"
      >
        {t.retry}
      </button>
    </div>
  );
}

function Heading({ title, sub }: { title: string; sub?: string }) {
  return (
    <div>
      <h1 className="font-display text-[clamp(32px,9.6vw,40px)] leading-[0.98] font-extrabold tracking-[-0.01em] text-balance uppercase">
        {title}
      </h1>
      {sub && (
        <p className="mt-3 max-w-[34ch] text-[16px] leading-snug text-ink-2">
          {sub}
        </p>
      )}
    </div>
  );
}

function Ballot({ t, onPick }: { t: T; onPick: (c: Contestant) => void }) {
  return (
    <div className="flex flex-1 flex-col" data-testid="vote-form">
      <Heading title={t.heading} sub={t.hint} />
      <ul className="mt-6 flex flex-1 flex-col gap-3" aria-label={t.heading}>
        {CONTESTANTS.map((c, i) => (
          <motion.li
            key={c.id}
            className="flex min-h-[96px] flex-1"
            initial={{ clipPath: "inset(0 100% 0 0)" }}
            animate={{ clipPath: "inset(0 0% 0 0)" }}
            transition={{ duration: 0.6, delay: 0.08 * i, ease: EASE }}
          >
            <button
              type="button"
              onClick={() => onPick(c)}
              data-testid={`choice-${c.id}`}
              className="slab group relative flex w-full flex-1 items-center bg-navy-800 text-left transition-colors duration-200 hover:bg-navy-700 active:bg-navy-700"
            >
              <span
                className="absolute inset-y-0 left-0 w-3.5 transition-[width] duration-300 ease-[var(--ease-broadcast)] group-hover:w-5 group-active:w-6"
                style={{ background: c.color }}
                aria-hidden
              />
              <span className="flex min-w-0 flex-1 items-center gap-4 py-4 pr-3 pl-9">
                <TeamLogo
                  contestant={c}
                  className="h-[clamp(52px,16vw,72px)]"
                  priority
                  sizes="96px"
                />
                <span className="min-w-0 font-display text-[clamp(26px,7.6vw,34px)] leading-[0.95] font-extrabold tracking-[-0.005em] uppercase">
                  {c.name}
                </span>
              </span>
              <span
                className="mr-4 flex h-12 w-12 shrink-0 items-center justify-center rounded-[3px] bg-white/[0.07] text-white transition-colors duration-200 group-hover:bg-blue group-hover:text-navy group-active:bg-blue group-active:text-navy"
                aria-hidden
              >
                <ArrowRight className="h-5 w-5" />
              </span>
            </button>
          </motion.li>
        ))}
      </ul>
    </div>
  );
}

function ConfirmSheet({
  contestant,
  t,
  submitting,
  error,
  onConfirm,
  onBack,
}: {
  contestant: Contestant;
  t: T;
  submitting: boolean;
  error: SubmitError;
  onConfirm: () => void;
  onBack: () => void;
}) {
  const confirmRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    confirmRef.current?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onBack();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onBack]);

  const errorText = error
    ? {
        network: t.errNetwork,
        rate_limited: t.errRate,
        server: t.errServer,
        invalid: t.errInvalid,
      }[error]
    : null;

  return (
    <div
      className="absolute inset-0 z-50 flex items-end justify-center"
      data-testid="confirm-sheet"
    >
      <motion.div
        className="absolute inset-0 bg-navy-950/80"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
        onClick={onBack}
        aria-hidden
      />
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-question"
        aria-describedby="confirm-final"
        className="relative w-full overflow-hidden rounded-t-[3px] bg-mist text-navy shadow-[0_-16px_48px_rgba(3,8,22,0.5)]"
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ duration: 0.42, ease: EASE }}
      >
        <div
          className="h-2"
          style={{ background: contestant.color }}
          aria-hidden
        />
        <div className="px-6 pt-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
          <div className="flex items-center gap-4">
            <TeamLogo
              contestant={contestant}
              className="h-16 ring-1 ring-navy/10"
              sizes="120px"
            />
            <p
              className="min-w-0 font-display text-[clamp(34px,10vw,46px)] leading-[0.92] font-extrabold tracking-[-0.01em] uppercase"
              data-testid="confirm-name"
            >
              {contestant.name}
            </p>
          </div>
          <h2
            id="confirm-question"
            className="mt-6 text-[20px] leading-snug font-semibold text-balance"
          >
            {t.confirmQuestion(contestant.name)}
          </h2>
          <p
            id="confirm-final"
            className="mt-2 flex items-start gap-2 text-[15px] leading-snug text-navy/70"
          >
            <Lock className="mt-0.5 h-4 w-4 shrink-0" />
            {t.confirmFinal}
          </p>
          {errorText && (
            <p
              role="alert"
              className="mt-4 bg-red-100 px-3.5 py-3 text-[14px] leading-snug text-red-900"
              data-testid="vote-error"
            >
              {errorText}
            </p>
          )}
          <button
            ref={confirmRef}
            type="button"
            onClick={onConfirm}
            disabled={submitting}
            aria-busy={submitting}
            data-testid="confirm-vote"
            className="mt-6 flex h-[60px] w-full items-center justify-center gap-3 rounded-[3px] bg-blue font-display text-[21px] font-bold tracking-[0.04em] text-navy uppercase transition-[filter] hover:brightness-105 active:brightness-95 disabled:cursor-wait"
          >
            {submitting ? (
              <>
                <span
                  className="spinner h-5 w-5 rounded-full border-[3px] border-navy/25 border-t-navy"
                  aria-hidden
                />
                {t.submitting}
              </>
            ) : error === "network" ? (
              t.retry
            ) : (
              t.confirmYes
            )}
          </button>
          <button
            type="button"
            onClick={onBack}
            disabled={submitting}
            data-testid="confirm-back"
            className="mt-2.5 h-12 w-full rounded-[3px] text-[16px] font-semibold text-navy ring-1 ring-navy/20 transition-colors hover:bg-navy/5 disabled:opacity-40"
          >
            {t.confirmBack}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function Receipt({ vote, t }: { vote: NonNullable<MyVote>; t: T }) {
  const contestant = getContestant(vote.contestantId);
  return (
    <div className="flex flex-1 flex-col" data-testid="vote-success">
      <motion.div
        className="flex h-14 w-14 items-center justify-center rounded-[3px] bg-blue text-navy"
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.45, ease: EASE }}
      >
        <Check className="h-8 w-8" />
      </motion.div>
      <h1 className="mt-6 font-display text-[clamp(30px,9vw,38px)] leading-[1] font-extrabold tracking-[-0.005em] text-balance uppercase">
        {t.successTitle}
      </h1>
      <p className="mt-3 text-[18px] text-ink-2">{t.successThanks}</p>

      {contestant && (
        <div className="wipe-in mt-8">
          <section className="slab bg-mist text-navy" aria-label={t.yourChoice}>
            <div className="flex items-stretch">
              <span
                className="w-3.5 shrink-0"
                style={{ background: contestant.color }}
                aria-hidden
              />
              <div className="flex flex-1 items-center gap-4 px-5 py-4">
                <TeamLogo
                  contestant={contestant}
                  className="h-12 ring-1 ring-navy/10"
                  sizes="96px"
                />
                <p
                  className="min-w-0 font-display text-[32px] leading-none font-extrabold uppercase"
                  data-testid="my-choice"
                >
                  {contestant.name}
                </p>
              </div>
            </div>
            <p className="flex items-start gap-2 border-t border-navy/10 py-3 pr-5 pl-9 text-[14px] leading-snug text-navy/70">
              <Lock className="mt-0.5 h-4 w-4 shrink-0" />
              {t.finalNote}
            </p>
            <p className="border-t border-navy/10 py-2.5 pr-5 pl-9 font-display text-[14px] font-semibold tracking-[0.06em] text-navy/55 uppercase tabular">
              {t.registeredAt(clockTime(vote.createdAt))}
            </p>
          </section>
        </div>
      )}
      <p className="mt-auto pt-8 text-[15px] text-muted">{t.watchScreen}</p>
    </div>
  );
}

function Waiting({ t }: { t: T }) {
  return (
    <div className="flex flex-1 flex-col" data-testid="vote-waiting">
      <Heading title={t.waitingTitle} sub={t.waitingBody} />
      <ul className="mt-8 grid gap-3" aria-hidden>
        {CONTESTANTS.map((c) => (
          <li
            key={c.id}
            className="slab relative flex h-[72px] items-center bg-navy-800/60"
          >
            <span
              className="absolute inset-y-0 left-0 w-3.5 opacity-60"
              style={{ background: c.color }}
            />
            <span className="pl-9 font-display text-[26px] font-extrabold text-white/55 uppercase">
              {c.name}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Closed({
  snapshot,
  myVote,
  t,
  locale,
}: {
  snapshot: Snapshot;
  myVote: MyVote;
  t: T;
  locale: Locale;
}) {
  const standings = computeStandings(snapshot);
  const mine = myVote ? getContestant(myVote.contestantId) : null;
  return (
    <div className="flex flex-1 flex-col" data-testid="vote-closed">
      <Heading
        title={t.closedTitle}
        sub={mine ? t.closedYourVote(mine.name) : t.closedThanks}
      />

      <div className="wipe-in mt-8">
        <section
          className="slab border-t-4 border-gold bg-navy-800"
          data-testid="vote-winner"
        >
          {!standings.hasVotes ? (
            <p className="px-5 py-6 font-display text-[26px] font-bold uppercase">
              {t.noVotes}
            </p>
          ) : (
            <>
              <ul className="grid gap-4 px-5 pt-5">
                {standings.leaders.map((w) => (
                  <li key={w.id} className="flex items-center gap-4">
                    <TeamLogo contestant={w} className="h-14" sizes="112px" />
                    <div className="min-w-0">
                      <div className="font-display text-[32px] leading-none font-extrabold uppercase">
                        {w.name}
                      </div>
                      <div className="mt-1.5 font-display text-[18px] font-semibold text-gold-300 tabular">
                        {formatNumber(w.votes, locale)} {t.votes(w.votes)} ·{" "}
                        {formatPercentFor(w.percentage, locale)}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
              <p className="px-5 pt-3 pb-5 text-[15px] font-semibold text-ink-2">
                {standings.isTie ? t.winnersTieLabel : t.winnerLabel}
              </p>
            </>
          )}
        </section>
      </div>
    </div>
  );
}

function PhoneTimer({
  openedAt,
  closesAt,
}: {
  openedAt: string | null;
  closesAt: string;
}) {
  const { remainingMs } = useCountdown({ open: true, openedAt, closesAt });
  const ms = remainingMs ?? 0;
  const urgent = ms <= 10_000;
  return (
    <span
      className={`tabular flex h-7 items-center px-2.5 font-display text-[17px] font-bold ${
        urgent ? "bg-red-500 text-white" : "bg-mist text-navy"
      }`}
      role="timer"
      data-testid="phone-timer"
    >
      {formatClock(ms)}
    </span>
  );
}

function TimeUp({ t }: { t: T }) {
  return (
    <div className="flex flex-1 flex-col" data-testid="vote-timeup">
      <Heading title={t.timeUp} sub={t.watchScreen} />
    </div>
  );
}
