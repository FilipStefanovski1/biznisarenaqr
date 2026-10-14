"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { ExpireAtZero } from "@/components/ExpireAtZero";
import { Logo } from "@/components/Logo";
import { TeamLogo } from "@/components/TeamLogo";
import { formatClock } from "@/lib/server-clock";
import { useCountdown } from "@/lib/use-countdown";
import { LOCALES, LOCALE_NAMES } from "@/i18n/messages";
import { computeStandings, formatCount, formatPercent } from "@/lib/results";
import type { SiteUrlCheck } from "@/lib/site-url";
import { parseSnapshot, type Snapshot } from "@/lib/snapshot";
import {
  useLiveScoreboard,
  type ConnectionState,
} from "@/lib/use-live-scoreboard";

type HistoryRound = Snapshot & { isActive: boolean };
type Confirm =
  | { kind: "close" }
  | { kind: "create"; label: string; isRehearsal: boolean }
  | { kind: "delete"; roundId: string; label: string; isActive: boolean }
  | null;

async function fetchHistory(): Promise<
  HistoryRound[] | "unauthenticated" | null
> {
  const res = await fetch("/api/admin/rounds", { cache: "no-store" }).catch(
    () => null,
  );
  if (!res) return null;
  if (res.status === 401) return "unauthenticated";
  if (!res.ok) return null;
  const body = (await res.json()) as { rounds: unknown[] };
  return body.rounds
    .map((r) => {
      const snap = parseSnapshot(r);
      return snap
        ? { ...snap, isActive: Boolean((r as { isActive?: boolean }).isActive) }
        : null;
    })
    .filter((r): r is HistoryRound => r !== null);
}

const DURATIONS: { label: string; seconds: number | null }[] = [
  { label: "1:00", seconds: 60 },
  { label: "2:00", seconds: 120 },
  { label: "3:00", seconds: 180 },
  { label: "5:00", seconds: 300 },
  { label: "Без", seconds: null },
];

const STATUS_LABEL = {
  waiting: "Чека",
  open: "Отворено",
  closed: "Затворено",
} as const;

export function AdminConsole({
  email,
  initial,
  site,
}: {
  email: string;
  initial: Snapshot | null;
  site: SiteUrlCheck;
}) {
  const { snapshot, connection, offer, refresh } = useLiveScoreboard(initial, {
    reconcileMs: 10000,
  });
  const [history, setHistory] = useState<HistoryRound[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<{
    tone: "ok" | "error";
    text: string;
  } | null>(null);
  const [confirm, setConfirm] = useState<Confirm>(null);
  const [newLabel, setNewLabel] = useState("");
  const [newRehearsal, setNewRehearsal] = useState(false);
  const busyRef = useRef(false);
  const [duration, setDuration] = useState<number | null>(120);
  const router = useRouter();

  const round = snapshot?.round ?? null;
  const standings = computeStandings(snapshot);

  const toLogin = useCallback(() => router.replace("/admin/login"), [router]);

  const applyHistory = useCallback(
    (rounds: HistoryRound[] | "unauthenticated" | null) => {
      if (rounds === "unauthenticated") toLogin();
      else if (rounds) setHistory(rounds);
    },
    [toLogin],
  );
  const loadHistory = useCallback(
    async () => applyHistory(await fetchHistory()),
    [applyHistory],
  );

  // Refresh history when the round or its status changes (not on every vote).
  const historyKey = `${round?.id}:${round?.status}`;
  useEffect(() => {
    void fetchHistory().then(applyHistory);
  }, [historyKey, applyHistory]);

  const act = useCallback(
    async (payload: Record<string, unknown>, success: string) => {
      if (busyRef.current) return;
      busyRef.current = true;
      setBusy(String(payload.action));
      setMessage(null);
      try {
        const res = await fetch("/api/admin/round", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (res.status === 401) {
          toLogin();
          return;
        }
        const body = (await res.json().catch(() => null)) as {
          ok?: boolean;
          code?: string;
          state?: unknown;
        } | null;
        if (body?.state) offer(parseSnapshot(body.state));
        if (res.ok && body?.ok) {
          setMessage({ tone: "ok", text: success });
        } else {
          setMessage({ tone: "error", text: errorText(body?.code) });
          void refresh();
        }
        void loadHistory();
      } catch {
        setMessage({
          tone: "error",
          text: "Нема врска со серверот. Проверете ја мрежата и обидете се повторно.",
        });
      } finally {
        busyRef.current = false;
        setBusy(null);
      }
    },
    [offer, refresh, loadHistory, toLogin],
  );

  const primary =
    round?.status === "waiting" ? (
      <div className="grid gap-3">
        <div
          className="flex items-center gap-2"
          role="radiogroup"
          aria-label="Времетраење на гласањето"
        >
          <span className="mr-2 text-sm font-semibold text-ink-2">Тајмер</span>
          {DURATIONS.map((d) => (
            <button
              key={d.label}
              type="button"
              role="radio"
              aria-checked={duration === d.seconds}
              onClick={() => setDuration(d.seconds)}
              className={`h-10 min-w-16 rounded-[3px] px-3 font-display text-[16px] font-bold tracking-[0.04em] transition-colors ${
                duration === d.seconds
                  ? "bg-blue text-navy"
                  : "text-ink-2 ring-1 ring-white/15 hover:bg-white/5 hover:text-white"
              }`}
              data-testid={`duration-${d.seconds ?? "none"}`}
            >
              {d.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          disabled={busy !== null}
          onClick={() =>
            void act(
              { action: "open", roundId: round.id, durationSeconds: duration },
              duration
                ? `Гласањето е отворено (${formatClock(duration * 1000)}).`
                : "Гласањето е отворено.",
            )
          }
          className="slab flex h-16 w-full items-center justify-center gap-3 bg-blue font-display text-[22px] font-bold tracking-[0.06em] text-navy uppercase transition-[filter] hover:brightness-105 disabled:opacity-50"
          data-testid="open-voting"
        >
          {busy === "open"
            ? "Се отвора…"
            : duration
              ? `Започни гласање · ${formatClock(duration * 1000)}`
              : "Започни гласање"}
        </button>
      </div>
    ) : round?.status === "open" ? (
      <div className="grid gap-3">
        {round.closesAt && (
          <AdminTimer
            openedAt={round.openedAt}
            closesAt={round.closesAt}
            disabled={busy !== null}
            onExtend={() =>
              void act(
                { action: "extend", roundId: round.id, seconds: 30 },
                "Додадени 30 секунди.",
              )
            }
          />
        )}
        <button
          type="button"
          disabled={busy !== null}
          onClick={() => setConfirm({ kind: "close" })}
          className="slab flex h-16 w-full items-center justify-center gap-3 bg-gold font-display text-[22px] font-bold tracking-[0.06em] text-navy uppercase transition-[filter] hover:brightness-105 disabled:opacity-50"
          data-testid="close-voting"
        >
          {round.closesAt
            ? "Заврши веднаш и прикажи победник"
            : "Заврши гласање и прикажи победник"}
        </button>
      </div>
    ) : round?.status === "closed" ? (
      <div className="flex items-center gap-4">
        <p className="flex-1 text-[15px] font-semibold text-ink-2">
          Резултатите се конечни и заклучени. Победникот е на LED екранот.
        </p>
        {round.isRehearsal && (
          <button
            type="button"
            disabled={busy !== null}
            onClick={() =>
              setConfirm({
                kind: "delete",
                roundId: round.id,
                label: round.label,
                isActive: true,
              })
            }
            className="flex h-14 items-center rounded-[3px] px-5 font-display text-[18px] font-bold tracking-[0.06em] text-red-200 uppercase ring-1 ring-red-300/40 hover:bg-red-500/10 disabled:opacity-50"
            data-testid="delete-round"
          >
            Избриши проба
          </button>
        )}
        <a
          href={`/api/admin/export?roundId=${round.id}`}
          className="slab flex h-14 items-center bg-mist px-6 font-display text-[18px] font-bold tracking-[0.06em] text-navy uppercase"
          data-testid="export-csv"
        >
          Преземи CSV
        </a>
      </div>
    ) : null;

  return (
    <div
      className="app-surface flex h-dvh flex-col overflow-hidden bg-navy-950 text-white max-lg:h-auto max-lg:min-h-dvh max-lg:overflow-visible"
      data-testid="admin-console"
    >
      {/* App bar */}
      <header className="flex h-16 shrink-0 items-center gap-4 border-b border-white/[0.08] bg-navy px-5">
        <div className="h-8 shrink-0">
          <Logo />
        </div>
        <span className="h-7 w-px bg-white/15" aria-hidden />
        <span className="font-display text-[17px] font-bold tracking-[0.12em] uppercase">
          Контролна соба
        </span>
        <div className="ml-auto flex items-center gap-4 text-sm">
          <ConnectionPill connection={connection} />
          <span className="hidden text-ink-2 md:inline">{email}</span>
          <form action="/auth/signout" method="post">
            <button className="h-9 rounded-[3px] px-3 font-semibold text-ink-2 ring-1 ring-white/15 hover:bg-white/5 hover:text-white">
              Одјава
            </button>
          </form>
        </div>
      </header>

      <div className="grid min-h-0 flex-1 lg:grid-cols-[1fr_380px]">
        {/* Stage: the live round */}
        <main
          className="flex min-h-0 flex-col gap-6 p-6 lg:p-8"
          data-testid="current-round"
        >
          {(site.error || site.warning) && (
            <div
              role="alert"
              className={`slab px-4 py-3 text-sm font-semibold ${
                site.error
                  ? "bg-red-500/15 text-red-200"
                  : "bg-amber-400/10 text-amber-200"
              }`}
            >
              {site.error ?? site.warning}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3">
            {round && <StatusBadge status={round.status} />}
            {round && (
              <span
                className={`flex h-7 items-center px-2.5 font-display text-[13px] font-bold tracking-[0.14em] uppercase ring-1 ${
                  round.isRehearsal
                    ? "text-white ring-white/60"
                    : "text-ink-2 ring-white/20"
                }`}
              >
                {round.isRehearsal ? "Проба" : "Продукција"}
              </span>
            )}
            <span className="ml-auto font-mono text-xs text-muted">
              {round ? `ID ${round.id.slice(0, 8)}` : ""}
            </span>
          </div>

          <div className="flex items-end justify-between gap-6">
            <h1
              className="font-display text-[clamp(28px,3vw,44px)] leading-[0.95] font-extrabold uppercase"
              data-testid="round-label"
            >
              {round?.label ?? "Нема активна рунда"}
            </h1>
            <div className="shrink-0 text-right">
              <div
                className="tabular font-display text-[64px] leading-none font-bold"
                data-testid="admin-total"
              >
                {formatCount(standings.total)}
              </div>
              <div className="mt-1 text-sm font-semibold text-muted">
                прифатени гласови
              </div>
            </div>
          </div>

          <ul className="flex min-h-0 flex-1 flex-col justify-center gap-3">
            {standings.rows.map((row) => (
              <li
                key={row.id}
                className="slab relative grid grid-cols-[14px_1fr_auto] items-stretch bg-navy-800"
                data-testid={`admin-row-${row.id}`}
                data-votes={row.votes}
              >
                <span style={{ background: row.color }} aria-hidden />
                <div className="min-w-0 px-5 py-4">
                  <div className="flex items-center gap-3">
                    <TeamLogo contestant={row} className="h-8" sizes="64px" />
                    <span className="font-display text-[26px] leading-none font-extrabold uppercase">
                      {row.name}
                    </span>
                    {row.isLeader && (
                      <span className="bg-gold px-2 py-0.5 font-display text-[12px] font-extrabold tracking-[0.12em] text-navy uppercase">
                        {standings.isTie ? "Нерешено" : "Води"}
                      </span>
                    )}
                  </div>
                  <div className="mt-3 h-3 bg-white/[0.07]">
                    <div
                      className="h-full transition-[width] duration-700 ease-[var(--ease-broadcast)] motion-reduce:transition-none"
                      style={{
                        width: `${row.percentage}%`,
                        background: row.color,
                      }}
                    />
                  </div>
                </div>
                <div className="flex flex-col items-end justify-center border-l border-white/[0.06] px-6">
                  <span className="tabular font-display text-[40px] leading-none font-bold">
                    {formatCount(row.votes)}
                  </span>
                  <span className="tabular font-display text-[16px] font-semibold text-ink-2">
                    {formatPercent(row.percentage)}
                  </span>
                </div>
              </li>
            ))}
          </ul>

          <div className="grid shrink-0 gap-3">
            {round?.isRehearsal && round.status === "open" && (
              <div
                className="flex items-center gap-2"
                data-testid="simulate-panel"
              >
                <span className="mr-2 text-sm font-semibold text-ink-2">
                  Пробни гласови (само тест на екранот)
                </span>
                {[1, 10, 50].map((n) => (
                  <button
                    key={n}
                    type="button"
                    disabled={busy !== null}
                    onClick={() =>
                      void act(
                        { action: "simulate", roundId: round.id, count: n },
                        `Додадени ${n} пробни гласови.`,
                      )
                    }
                    className="h-9 rounded-[3px] px-3 font-display text-[15px] font-bold ring-1 ring-white/20 hover:bg-white/5 disabled:opacity-50"
                  >
                    +{n}
                  </button>
                ))}
              </div>
            )}
            {primary}
            {message && (
              <p
                role={message.tone === "error" ? "alert" : "status"}
                className={`text-sm font-semibold ${message.tone === "error" ? "text-red-300" : "text-emerald-300"}`}
                data-testid="admin-message"
              >
                {message.text}
              </p>
            )}
          </div>
        </main>

        {/* Rail: screen, QR, rounds */}
        <aside className="min-h-0 overflow-y-auto overscroll-contain border-l border-white/[0.08] bg-navy">
          <RailSection title="LED екран">
            <div className="grid grid-cols-2 gap-2">
              <a
                href="/screen"
                target="_blank"
                rel="noreferrer"
                className="slab flex h-11 items-center justify-center bg-mist font-semibold text-navy"
              >
                Отвори екран
              </a>
              <a
                href="/vote"
                target="_blank"
                rel="noreferrer"
                className="flex h-11 items-center justify-center rounded-[3px] font-semibold ring-1 ring-white/20 hover:bg-white/5"
              >
                Отвори гласање
              </a>
            </div>
            <div className="mt-4" data-testid="screen-language">
              <p className="text-sm text-ink-2">
                Јазик на екранот (се менува веднаш)
              </p>
              <div
                className="mt-2 grid grid-cols-5 gap-1.5"
                role="radiogroup"
                aria-label="Јазик на LED екранот"
              >
                {LOCALES.map((code) => {
                  const active = (snapshot?.screenLocale ?? "mk") === code;
                  return (
                    <button
                      key={code}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      title={LOCALE_NAMES[code]}
                      disabled={busy !== null}
                      onClick={() =>
                        !active &&
                        void act(
                          { action: "locale", locale: code },
                          `LED екран: ${LOCALE_NAMES[code]}.`,
                        )
                      }
                      className={`h-10 rounded-[3px] font-display text-[15px] font-bold tracking-[0.08em] uppercase transition-colors ${
                        active
                          ? "bg-blue text-navy"
                          : "text-ink-2 ring-1 ring-white/15 hover:bg-white/5 hover:text-white"
                      }`}
                      data-testid={`screen-locale-${code}`}
                    >
                      {code}
                    </button>
                  );
                })}
              </div>
            </div>
          </RailSection>

          {site.ok && site.voteUrl && (
            <RailSection title="QR код">
              <div className="flex gap-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/api/qr?format=svg"
                  alt={`QR код за ${site.voteUrl}`}
                  className="h-28 w-28 shrink-0 rounded-[3px] bg-white"
                />
                <div className="min-w-0">
                  <p
                    className="font-mono text-xs break-all text-ink-2"
                    data-testid="admin-vote-url"
                  >
                    {site.voteUrl}
                  </p>
                  <div className="mt-3 flex gap-2 text-sm font-semibold">
                    <a
                      href="/api/qr?format=png&download=1"
                      className="rounded-[3px] px-3 py-1.5 ring-1 ring-white/20 hover:bg-white/5"
                    >
                      PNG
                    </a>
                    <a
                      href="/api/qr?format=svg&download=1"
                      className="rounded-[3px] px-3 py-1.5 ring-1 ring-white/20 hover:bg-white/5"
                    >
                      SVG
                    </a>
                  </div>
                </div>
              </div>
            </RailSection>
          )}

          <RailSection title="Нова рунда">
            <p className="text-sm text-ink-2">
              Претходните резултати се чуваат. Гостите можат повторно да
              гласаат.
            </p>
            <form
              className="mt-3 grid gap-3"
              onSubmit={(e) => {
                e.preventDefault();
                const label = newLabel.trim();
                if (label)
                  setConfirm({
                    kind: "create",
                    label,
                    isRehearsal: newRehearsal,
                  });
              }}
            >
              <input
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                maxLength={120}
                placeholder="Назив, на пр. Финале"
                className="h-11 rounded-[3px] bg-navy-800 px-3 text-sm text-white ring-1 ring-white/15 outline-none placeholder:text-muted focus:ring-2 focus:ring-blue"
                data-testid="new-round-label"
              />
              <label className="flex items-center gap-2 text-sm font-medium text-ink-2">
                <input
                  type="checkbox"
                  checked={newRehearsal}
                  onChange={(e) => setNewRehearsal(e.target.checked)}
                  className="h-4 w-4 accent-[#0ea5ff]"
                  data-testid="new-round-rehearsal"
                />
                Пробна рунда — одвоена од вистинското гласање
              </label>
              <button
                type="submit"
                disabled={
                  busy !== null || round?.status === "open" || !newLabel.trim()
                }
                className="h-11 rounded-[3px] font-display text-[16px] font-bold tracking-[0.06em] uppercase ring-1 ring-white/30 hover:bg-white/5 disabled:text-muted disabled:ring-white/10"
                data-testid="create-round"
              >
                Креирај нова рунда
              </button>
              {round?.status === "open" && (
                <p className="text-xs text-muted">
                  Прво завршете го тековното гласање.
                </p>
              )}
            </form>
          </RailSection>

          <RailSection title="Историја">
            <ul className="grid gap-2" data-testid="history">
              {history.map((h) => {
                const s = computeStandings(h);
                const winner =
                  h.round?.status !== "closed"
                    ? STATUS_LABEL[h.round!.status]
                    : !s.hasVotes
                      ? "Нема гласови"
                      : `${s.isTie ? "Нерешено: " : ""}${s.leaders.map((l) => l.name).join(", ")}`;
                return (
                  <li
                    key={h.round!.id}
                    className="rounded-[3px] bg-navy-800/70 px-3 py-2.5"
                  >
                    <div className="flex items-baseline gap-2">
                      <span className="min-w-0 flex-1 truncate text-sm font-semibold">
                        {h.round!.label}
                      </span>
                      <span className="tabular font-display text-[15px] font-bold">
                        {formatCount(h.total)}
                      </span>
                    </div>
                    <div className="mt-0.5 flex items-center gap-2 text-xs text-muted">
                      <span>
                        {h.round!.isRehearsal ? "Проба" : "Продукција"}
                      </span>
                      {h.isActive && (
                        <span className="text-blue">· активна</span>
                      )}
                      <span className="min-w-0 flex-1 truncate">
                        · {winner}
                      </span>
                      {h.round!.status === "closed" && (
                        <a
                          className="font-semibold text-white hover:text-blue"
                          href={`/api/admin/export?roundId=${h.round!.id}`}
                        >
                          CSV
                        </a>
                      )}
                      {h.round!.isRehearsal && h.round!.status !== "open" && (
                        <button
                          type="button"
                          disabled={busy !== null}
                          onClick={() =>
                            setConfirm({
                              kind: "delete",
                              roundId: h.round!.id,
                              label: h.round!.label,
                              isActive: h.isActive,
                            })
                          }
                          className="font-semibold text-red-300 hover:text-red-200 disabled:opacity-50"
                          data-testid={`delete-round-${h.round!.id}`}
                        >
                          Избриши
                        </button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </RailSection>
        </aside>
      </div>

      {round?.status === "open" && round.closesAt && (
        <ExpireAtZero
          key={`${round.id}:${round.closesAt}`}
          openedAt={round.openedAt}
          closesAt={round.closesAt}
          onState={offer}
        />
      )}

      <ConfirmDialog
        confirm={confirm}
        onCancel={() => setConfirm(null)}
        onConfirm={() => {
          const current = confirm;
          setConfirm(null);
          if (!current) return;
          if (current.kind === "close" && round) {
            void act(
              { action: "close", roundId: round.id },
              "Гласањето е затворено. Победникот е прикажан на екранот.",
            );
          } else if (current.kind === "delete") {
            void act(
              { action: "delete", roundId: current.roundId },
              `Пробната рунда „${current.label}“ е избришана.`,
            );
          } else if (current.kind === "create") {
            void act(
              {
                action: "create",
                label: current.label,
                isRehearsal: current.isRehearsal,
              },
              "Новата рунда е креирана и е активна.",
            ).then(() => setNewLabel(""));
          }
        }}
      />
    </div>
  );
}

function RailSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-b border-white/[0.08] px-5 py-5">
      <h2 className="mb-3 font-display text-[15px] font-bold tracking-[0.1em] text-white uppercase">
        {title}
      </h2>
      {children}
    </section>
  );
}

function errorText(code: string | undefined): string {
  switch (code) {
    case "forbidden":
      return "Немате администраторски пристап.";
    case "active_round_open":
      return "Не може да се креира нова рунда додека гласањето е отворено.";
    case "invalid_transition":
      return "Оваа акција не е дозволена во моменталниот статус.";
    case "round_not_active":
      return "Рундата веќе не е активна. Состојбата е освежена.";
    case "not_rehearsal":
      return "Ова е дозволено само за пробни рунди.";
    case "invalid_duration":
      return "Неважечко времетраење.";
    case "no_timer":
    case "time_over":
      return "Тајмерот веќе не работи.";
    case "round_open":
      return "Прво завршете го гласањето во пробната рунда.";
    case "no_other_round":
      return "Ова е единствената рунда. Прво креирајте продукциска рунда.";
    case "invalid_locale":
    case "invalid_label":
    case "invalid_request":
      return "Неважечки податоци.";
    default:
      return "Акцијата не успеа. Обидете се повторно.";
  }
}

function StatusBadge({ status }: { status: "waiting" | "open" | "closed" }) {
  const cls =
    status === "open"
      ? "bg-blue text-navy"
      : status === "closed"
        ? "bg-gold text-navy"
        : "bg-white/10 text-ink-2";
  return (
    <span
      className={`chamfer-r flex h-7 items-center pr-4 pl-2.5 font-display text-[13px] font-bold tracking-[0.14em] ${cls}`}
      data-testid="admin-status"
    >
      {STATUS_LABEL[status].toUpperCase()}
    </span>
  );
}

function ConnectionPill({ connection }: { connection: ConnectionState }) {
  const live = connection === "live";
  return (
    <span
      className={`inline-flex items-center gap-2 text-xs font-semibold ${live ? "text-ink-2" : "text-amber-300"}`}
      data-testid="admin-connection"
      data-connection={connection}
    >
      <span
        className={`h-2 w-2 rounded-full ${live ? "live-dot bg-blue" : "bg-amber-400"}`}
      />
      {live
        ? "Поврзано во живо"
        : connection === "connecting"
          ? "Се поврзува…"
          : "Повторно поврзување…"}
    </span>
  );
}

function ConfirmDialog({
  confirm,
  onCancel,
  onConfirm,
}: {
  confirm: Confirm;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (confirm && !dialog.open) dialog.showModal();
    if (!confirm && dialog.open) dialog.close();
  }, [confirm]);

  const title =
    confirm?.kind === "close"
      ? "Да се заврши гласањето?"
      : confirm?.kind === "delete"
        ? "Да се избрише пробната рунда?"
        : "Да се креира нова рунда?";
  const body =
    confirm?.kind === "close"
      ? "Гласањето ќе се затвори веднаш, нови гласови нема да се примаат, а победникот ќе се прикаже на LED екранот. Ова не може да се врати."
      : confirm?.kind === "delete"
        ? `Пробната рунда „${confirm.label}“ и сите нејзини пробни гласови ќе бидат трајно избришани.${
            confirm.isActive
              ? " Екранот и телефоните ќе се вратат на продукциската рунда."
              : ""
          } Продукциските рунди не се допираат.`
        : confirm?.kind === "create"
          ? `Ќе се креира нова ${confirm.isRehearsal ? "ПРОБНА" : "ПРОДУКЦИСКА"} рунда „${confirm.label}“ која веднаш станува активна на екранот и страницата за гласање. Претходните резултати остануваат зачувани.`
          : "";

  return (
    <dialog
      ref={ref}
      onCancel={(e) => {
        e.preventDefault();
        onCancel();
      }}
      className="slab m-auto w-[min(92vw,480px)] bg-mist p-0 text-navy backdrop:bg-navy-950/80"
      data-testid="confirm-dialog"
    >
      <div className="p-6">
        <h3 className="font-display text-[26px] leading-tight font-extrabold uppercase">
          {title}
        </h3>
        <p className="mt-2 text-navy/75">{body}</p>
        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="h-11 rounded-[3px] px-4 font-semibold ring-1 ring-navy/25"
          >
            Откажи
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="h-11 rounded-[3px] bg-navy px-4 font-display text-[16px] font-bold tracking-[0.04em] text-white uppercase"
            data-testid="confirm-yes"
          >
            {confirm?.kind === "close"
              ? "Да, заврши и прикажи победник"
              : confirm?.kind === "delete"
                ? "Да, избриши"
                : "Да, креирај"}
          </button>
        </div>
      </div>
    </dialog>
  );
}

function AdminTimer({
  openedAt,
  closesAt,
  disabled,
  onExtend,
}: {
  openedAt: string | null;
  closesAt: string;
  disabled: boolean;
  onExtend: () => void;
}) {
  const { remainingMs, totalMs } = useCountdown({
    open: true,
    openedAt,
    closesAt,
  });
  const ms = remainingMs ?? 0;
  const pct = totalMs ? Math.max(0, Math.min(1, ms / totalMs)) : 0;
  const urgent = ms <= 10_000;
  return (
    <div
      className="flex items-center gap-4"
      data-testid="admin-timer"
      data-remaining={Math.ceil(ms / 1000)}
    >
      <span
        className={`tabular w-24 font-display text-[40px] leading-none font-bold ${urgent ? "text-red-400" : ""}`}
      >
        {ms > 0 ? formatClock(ms) : "0:00"}
      </span>
      <div className="h-2 flex-1 bg-white/[0.08]">
        <div
          className={`h-full origin-left transition-transform duration-300 ease-linear ${urgent ? "bg-red-400" : "bg-blue"}`}
          style={{ transform: `scaleX(${pct})` }}
        />
      </div>
      <button
        type="button"
        disabled={disabled || ms <= 0}
        onClick={onExtend}
        className="h-10 rounded-[3px] px-3 font-display text-[16px] font-bold ring-1 ring-white/20 hover:bg-white/5 disabled:opacity-40"
        data-testid="extend-timer"
      >
        +30 сек
      </button>
    </div>
  );
}
