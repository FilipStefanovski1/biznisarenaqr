import { expect, type APIRequestContext, type Browser, type BrowserContext, type Page } from "@playwright/test";
import { loadEnv } from "../../scripts/load-env";

loadEnv();

export const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL ?? "admin@biznisarena.test";
export const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD ?? "";

export type Snapshot = {
  version: number;
  screenLocale?: string;
  round: { id: string; status: "waiting" | "open" | "closed"; isRehearsal: boolean; label: string } | null;
  results: { contestantId: string; votes: number }[];
  total: number;
};

export async function loginAdmin(page: Page) {
  if (!ADMIN_PASSWORD) throw new Error("Set E2E_ADMIN_PASSWORD (see README: local admin provisioning).");
  await page.goto("/admin/login");
  await page.getByLabel("Е-пошта").fill(ADMIN_EMAIL);
  await page.getByLabel("Лозинка").fill(ADMIN_PASSWORD);
  await page.getByRole("button", { name: "Најави се" }).click();
  await expect(page.getByTestId("admin-console")).toBeVisible();
}

/** Admin API calls made with the logged-in page's cookies. */
export function adminApi(page: Page, baseURL: string) {
  const post = async (data: Record<string, unknown>) => {
    const res = await page.request.post("/api/admin/round", { data, headers: { Origin: baseURL } });
    return { status: res.status(), body: (await res.json()) as { ok: boolean; code: string; state?: Snapshot } };
  };
  return {
    post,
    async state(): Promise<Snapshot> {
      return (await page.request.get("/api/state?fresh=1")).json();
    },
    /** Closes any open round, then creates (and optionally opens) a fresh rehearsal round. */
    async freshRound(opts: { open?: boolean; label?: string } = {}): Promise<string> {
      const current = (await (await page.request.get("/api/state?fresh=1")).json()) as Snapshot;
      if (current.round?.status === "open") await post({ action: "close", roundId: current.round.id });
      const created = await post({ action: "create", label: opts.label ?? `E2E ${new Date().toISOString()}`, isRehearsal: true });
      expect(created.body.ok, JSON.stringify(created.body)).toBe(true);
      const id = created.body.state!.round!.id;
      if (opts.open !== false) expect((await post({ action: "open", roundId: id })).body.ok).toBe(true);
      return id;
    },
  };
}

/** A separate "phone": its own browser context => its own voter cookie. */
export async function newGuest(browser: Browser, locale = "mk-MK"): Promise<{ context: BrowserContext; page: Page }> {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, locale });
  const page = await context.newPage();
  return { context, page };
}

export async function voteInUi(page: Page, contestantId: string) {
  await page.goto("/vote");
  await page.getByTestId(`choice-${contestantId}`).click();
  await expect(page.getByTestId("confirm-sheet")).toBeVisible();
  await page.getByTestId("confirm-vote").click();
  await expect(page.getByText("Твојот глас е успешно регистриран!")).toBeVisible();
}

/** Votes over HTTP like a phone would (GET to receive identity cookie, then POST). */
export async function voteViaApi(request: APIRequestContext, baseURL: string, roundId: string, contestantId: string) {
  await request.get("/api/vote");
  const res = await request.post("/api/vote", { data: { roundId, contestantId }, headers: { Origin: baseURL } });
  return { status: res.status(), body: (await res.json()) as { ok: boolean; code: string } };
}

export async function screenVotes(page: Page, id: string): Promise<number> {
  return Number(await page.getByTestId(`row-${id}`).getAttribute("data-votes"));
}
