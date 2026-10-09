import { describe, expect, it } from "vitest";
import { computeStandings, formatCount, formatPercent, percentageOf, votesLabel } from "@/lib/results";

const snap = (yova: number, bubu: number, seed: number) => ({
  total: yova + bubu + seed,
  results: [
    { contestantId: "yova", votes: yova },
    { contestantId: "bubu-kosmetik", votes: bubu },
    { contestantId: "seed-of-life", votes: seed },
  ],
});

describe("computeStandings", () => {
  it("ranks by votes with a single leader", () => {
    const s = computeStandings(snap(2, 5, 3));
    expect(s.rows.map((r) => r.id)).toEqual(["bubu-kosmetik", "seed-of-life", "yova"]);
    expect(s.leaders.map((l) => l.id)).toEqual(["bubu-kosmetik"]);
    expect(s.isTie).toBe(false);
    expect(s.rows.map((r) => r.rank)).toEqual([1, 2, 3]);
  });

  it("reports a first-place tie without a sole leader and orders ties deterministically", () => {
    const s = computeStandings(snap(4, 1, 4));
    expect(s.isTie).toBe(true);
    expect(s.leaders.map((l) => l.id)).toEqual(["yova", "seed-of-life"]);
    expect(s.rows.map((r) => r.id)).toEqual(["yova", "seed-of-life", "bubu-kosmetik"]);
    expect(s.rows.map((r) => r.rank)).toEqual([1, 1, 3]);
    expect(s.rows[0]!.percentage).toBe(s.rows[1]!.percentage);
  });

  it("three-way tie", () => {
    const s = computeStandings(snap(1, 1, 1));
    expect(s.leaders).toHaveLength(3);
    expect(s.rows.every((r) => r.percentage === 33.3)).toBe(true);
  });

  it("zero votes: no leader, no winner", () => {
    const s = computeStandings(snap(0, 0, 0));
    expect(s.hasVotes).toBe(false);
    expect(s.leaders).toHaveLength(0);
    expect(s.isTie).toBe(false);
    expect(s.rows.map((r) => r.id)).toEqual(["yova", "bubu-kosmetik", "seed-of-life"]);
    expect(computeStandings(null).hasVotes).toBe(false);
  });

  it("formats numbers identically on every runtime", () => {
    expect(percentageOf(1, 3)).toBe(33.3);
    expect(percentageOf(0, 0)).toBe(0);
    expect(formatPercent(48.24)).toBe("48,2%");
    expect(formatPercent(100)).toBe("100,0%");
    expect(formatCount(1234567)).toBe("1.234.567");
    expect(votesLabel(1)).toBe("глас");
    expect(votesLabel(21)).toBe("глас");
    expect(votesLabel(11)).toBe("гласови");
    expect(votesLabel(0)).toBe("гласови");
  });
});
