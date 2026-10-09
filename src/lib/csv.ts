import { computeStandings } from "@/lib/results";
import type { Snapshot } from "@/lib/snapshot";

function cell(value: string | number | boolean | null | undefined): string {
  const text = value === null || value === undefined ? "" : String(value);
  // Neutralise spreadsheet formula injection and quote everything.
  const safe = /^[=+\-@\t\r]/.test(text) ? `'${text}` : text;
  return `"${safe.replace(/"/g, '""')}"`;
}

/** Aggregate-only export of one round. Never contains voter identities. */
export function resultsToCsv(snapshot: Snapshot): string {
  const round = snapshot.round;
  if (!round) throw new Error("No round");
  const standings = computeStandings(snapshot);
  const header = [
    "round_id",
    "round_label",
    "mode",
    "status",
    "opened_at",
    "closed_at",
    "rank",
    "contestant_id",
    "contestant",
    "votes",
    "percentage",
    "is_winner",
    "is_tie",
    "total_votes",
  ];
  const rows = standings.rows.map((row) => [
    round.id,
    round.label,
    round.isRehearsal ? "rehearsal" : "production",
    round.status,
    round.openedAt,
    round.closedAt,
    row.rank,
    row.id,
    row.name,
    row.votes,
    row.percentage.toFixed(1),
    round.status === "closed" && row.isLeader,
    standings.isTie && row.isLeader,
    standings.total,
  ]);
  const lines = [header, ...rows].map((r) => r.map(cell).join(","));
  // BOM so Excel opens the Cyrillic labels as UTF-8.
  return `﻿${lines.join("\r\n")}\r\n`;
}
