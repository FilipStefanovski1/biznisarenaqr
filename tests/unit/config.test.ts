import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { CONTESTANTS } from "@/config/contestants";
import { resultsToCsv } from "@/lib/csv";

describe("central contestant configuration", () => {
  it("has exactly the three event contestants", () => {
    expect(CONTESTANTS.map((c) => c.name)).toEqual(["YOVA", "BUBU KOSMETIK", "SEED OF LIFE"]);
    expect(new Set(CONTESTANTS.map((c) => c.color)).size).toBe(3);
  });

  it("matches the contestants seeded by the database migration", () => {
    const dir = join(process.cwd(), "supabase/migrations");
    const sql = readdirSync(dir).map((f) => readFileSync(join(dir, f), "utf8")).join("\n");
    const block = sql.match(/insert into voting\.contestants[^;]+;/)?.[0] ?? "";
    const rows = [...block.matchAll(/\('([^']+)',\s*'([^']+)',\s*(\d+)\)/g)].map((m) => ({
      id: m[1],
      name: m[2],
      displayOrder: Number(m[3]),
    }));
    expect(rows).toEqual(CONTESTANTS.map(({ id, name, displayOrder }) => ({ id, name, displayOrder })));
  });
});

describe("CSV export", () => {
  it("contains aggregates only, marks ties and protects against formula injection", () => {
    const csv = resultsToCsv({
      version: 5,
      screenLocale: "mk",
      round: { id: "11111111-1111-4111-8111-111111111111", label: "=HYPERLINK(\"x\")", isRehearsal: false, status: "closed", openedAt: "a", closedAt: "2026-10-08T20:00:00Z" },
      results: [
        { contestantId: "yova", votes: 3 },
        { contestantId: "bubu-kosmetik", votes: 3 },
        { contestantId: "seed-of-life", votes: 1 },
      ],
      total: 7,
    });
    const lines = csv.replace(/^﻿/, "").trim().split("\r\n");
    expect(lines).toHaveLength(4);
    expect(lines[0]).toContain('"contestant","votes","percentage","is_winner","is_tie"');
    expect(lines[1]).toContain('"YOVA","3","42.9","true","true"');
    expect(lines[2]).toContain('"BUBU KOSMETIK","3","42.9","true","true"');
    expect(lines[3]).toContain('"SEED OF LIFE","1","14.3","false","false"');
    expect(csv).toContain(`"'=HYPERLINK(""x"")"`);
    expect(csv).not.toMatch(/voter/i);
  });
});
