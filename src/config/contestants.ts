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
  /** Brand logo supplied by the organizers, shown on a tile in its own background colour. */
  logo: { src: string; background: string; fit: "contain" | "cover" };
};

export const CONTESTANTS: readonly Contestant[] = [
  {
    id: "yova",
    name: "YOVA",
    displayOrder: 1,
    color: "#EF6F5E",
    logo: { src: "/teams/yova.png", background: "#262626", fit: "cover" },
  },
  {
    // id kept from the original listing so stored votes stay valid; display name is the brand's.
    id: "bubu-kosmetik",
    name: "BOOBOO",
    displayOrder: 2,
    color: "#B98CF5",
    logo: { src: "/teams/booboo.png", background: "#FFFFFF", fit: "contain" },
  },
  {
    id: "seed-of-life",
    name: "SEED OF LIFE",
    displayOrder: 3,
    color: "#3CCB8C",
    logo: { src: "/teams/seed-of-life.png", background: "#FFFFFF", fit: "contain" },
  },
] as const;

const BY_ID = new Map(CONTESTANTS.map((c) => [c.id, c]));

export function getContestant(id: string): Contestant | undefined {
  return BY_ID.get(id);
}

export function isContestantId(id: unknown): id is string {
  return typeof id === "string" && BY_ID.has(id);
}
