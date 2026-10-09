import { CONTESTANTS, type Contestant } from "@/config/contestants";
import type { Snapshot } from "@/lib/snapshot";

export type Standing = Contestant & {
  votes: number;
  /** Share of all accepted votes, rounded to one decimal. Equal votes => equal value. */
  percentage: number;
  /** Competition rank: tied contestants share a rank (1, 1, 3). */
  rank: number;
  /** True for every contestant sharing first place, but only once votes exist. */
  isLeader: boolean;
};

export type Standings = {
  rows: Standing[];
  total: number;
  leaders: Standing[];
  isTie: boolean;
  hasVotes: boolean;
};

export function percentageOf(votes: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((votes / total) * 1000) / 10;
}

/**
 * Ranks contestants by votes (desc). Ties are ordered deterministically by the central
 * configuration order so the layout never flickers, while `rank`/`isLeader` stay equal
 * for tied contestants so no sole leader is implied.
 */
export function computeStandings(snapshot: Pick<Snapshot, "results" | "total"> | null): Standings {
  const counts = new Map(snapshot?.results.map((r) => [r.contestantId, r.votes]) ?? []);
  const total = snapshot?.total ?? 0;

  const sorted = CONTESTANTS.map((c) => ({ contestant: c, votes: counts.get(c.id) ?? 0 })).sort(
    (a, b) => b.votes - a.votes || a.contestant.displayOrder - b.contestant.displayOrder,
  );

  const maxVotes = sorted[0]?.votes ?? 0;
  const hasVotes = total > 0 && maxVotes > 0;

  const rows: Standing[] = [];
  sorted.forEach((entry, index) => {
    const previous = rows[index - 1];
    const rank = previous && previous.votes === entry.votes ? previous.rank : index + 1;
    rows.push({
      ...entry.contestant,
      votes: entry.votes,
      percentage: percentageOf(entry.votes, total),
      rank,
      isLeader: hasVotes && entry.votes === maxVotes,
    });
  });

  const leaders = rows.filter((r) => r.isLeader);
  return { rows, total, leaders, isTie: leaders.length > 1, hasVotes };
}

// Formatting is done by hand (Macedonian style: "1.234", "48,2%") so server and browser
// output are identical regardless of the ICU data each runtime ships with.
export function formatCount(value: number): string {
  return String(Math.round(value)).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

export function formatPercent(value: number): string {
  const tenths = Math.round(value * 10);
  return `${formatCount(Math.floor(tenths / 10))},${tenths % 10}%`;
}

/** Macedonian plural for "глас/гласови". */
export function votesLabel(count: number): string {
  return count % 10 === 1 && count % 100 !== 11 ? "глас" : "гласови";
}
