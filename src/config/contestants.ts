/**
 * Central contestant configuration.
 *
 * The database (supabase/migrations/*_voting_schema.sql) holds the same ids, names and
 * order so that it can validate votes server-side. tests/unit/config.test.ts fails if the
 * two ever drift apart.
 *
 * `color` is the stable on-screen identity of each contestant (tab + bar). It never
 * changes when positions change. The three hues are one broadcast "party colour" family
 * that deliberately avoids electric blue (reserved for LIVE / active state) and gold
 * (reserved for the leader and winner).
 */
export type Contestant = {
  id: string;
  name: string;
  displayOrder: number;
  color: string;
};

export const CONTESTANTS: readonly Contestant[] = [
  { id: "yova", name: "YOVA", displayOrder: 1, color: "#EF6F5E" },
  { id: "bubu-kosmetik", name: "BUBU KOSMETIK", displayOrder: 2, color: "#B98CF5" },
  { id: "seed-of-life", name: "SEED OF LIFE", displayOrder: 3, color: "#3CCB8C" },
] as const;

const BY_ID = new Map(CONTESTANTS.map((c) => [c.id, c]));

export function getContestant(id: string): Contestant | undefined {
  return BY_ID.get(id);
}

export function isContestantId(id: unknown): id is string {
  return typeof id === "string" && BY_ID.has(id);
}
