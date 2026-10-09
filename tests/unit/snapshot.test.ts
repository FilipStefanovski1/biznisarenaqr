import { describe, expect, it } from "vitest";
import { isNewer, parseSnapshot } from "@/lib/snapshot";

const base = {
  version: 10,
  round: { id: "11111111-1111-4111-8111-111111111111", label: "R", isRehearsal: true, status: "open", openedAt: "x", closedAt: null },
  results: [
    { contestantId: "yova", votes: 2 },
    { contestantId: "bubu-kosmetik", votes: 1 },
    { contestantId: "seed-of-life", votes: 0 },
  ],
  total: 3,
};

describe("snapshot ordering", () => {
  it("accepts only strictly newer versions", () => {
    const a = parseSnapshot(base)!;
    const older = parseSnapshot({ ...base, version: 9 })!;
    const newer = parseSnapshot({ ...base, version: 11 })!;
    expect(isNewer(null, a)).toBe(true);
    expect(isNewer(a, older)).toBe(false);
    expect(isNewer(a, a)).toBe(false);
    expect(isNewer(a, newer)).toBe(true);
  });

  it("rejects malformed or inconsistent payloads", () => {
    expect(parseSnapshot({ ...base, total: 4 })).toBeNull();
    expect(parseSnapshot({ ...base, version: -1 })).toBeNull();
    expect(parseSnapshot({ hello: "world" })).toBeNull();
    expect(parseSnapshot({ ...base, round: { ...base.round, status: "hacked" } })).toBeNull();
  });
});
