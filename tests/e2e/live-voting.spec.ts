import { expect, request as playwrightRequest, test } from "@playwright/test";
import { adminApi, loginAdmin, newGuest, screenVotes, voteInUi, voteViaApi, type Snapshot } from "./helpers";

test.describe("live voting end to end", () => {
  test("votes from different phones move the LED screen without a refresh", async ({ browser, page, baseURL }) => {
    await loginAdmin(page);
    const admin = adminApi(page, baseURL!);
    await admin.freshRound();

    const screenCtx = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
    const screen = await screenCtx.newPage();
    await screen.goto("/screen");
    await expect(screen.getByTestId("connection")).toHaveAttribute("data-connection", "live");
    await expect(screen.getByTestId("status-chip")).toHaveAttribute("data-state", "open");
    const navigations: string[] = [];
    screen.on("framenavigated", (f) => f === screen.mainFrame() && navigations.push(f.url()));

    const choices = ["yova", "seed-of-life", "yova"];
    const latencies: number[] = [];
    for (const [i, choice] of choices.entries()) {
      const guest = await newGuest(browser);
      const before = await screenVotes(screen, choice);
      await guest.page.goto("/vote");
      await guest.page.getByTestId(`choice-${choice}`).click();
      await expect(guest.page.getByTestId("confirm-name")).toHaveText(choice === "yova" ? "YOVA" : "SEED OF LIFE");
      const response = guest.page.waitForResponse((r) => r.url().endsWith("/api/vote") && r.request().method() === "POST");
      await guest.page.getByTestId("confirm-vote").click();
      await response;
      const start = Date.now(); // server accepted the vote
      await expect.poll(() => screenVotes(screen, choice), { timeout: 5000, intervals: [10] }).toBe(before + 1);
      latencies.push(Date.now() - start);
      await expect(guest.page.getByText("Твојот глас е успешно регистриран!")).toBeVisible();
      await expect(guest.page.getByText("Ти благодариме што гласаше.")).toBeVisible();
      await expect(screen.locator('[data-testid="screen"]')).toHaveAttribute("data-status", "open");
      await guest.context.close();
      test.info().annotations.push({ type: "vote", description: `#${i + 1} ${choice}` });
    }

    await expect(screen.getByTestId("row-yova")).toHaveAttribute("data-leader", "true");
    await expect(screen.getByTestId("row-yova").getByText("Води", { exact: true })).toBeVisible();
    await expect(screen.getByText("Води", { exact: true })).toHaveCount(1);
    // Leader is listed first.
    await expect(screen.locator("[data-testid^=row-]").first()).toHaveAttribute("data-testid", "row-yova");
    expect(navigations).toEqual([]); // never reloaded
    test.info().annotations.push({ type: "latency", description: `vote accepted→screen ms: ${latencies.join(", ")}` });
    console.log(`[measure] vote accepted by server → LED screen updated (ms): ${latencies.join(", ")}`);
    expect(Math.max(...latencies)).toBeLessThan(2000);
    await screenCtx.close();
  });

  test("double taps and concurrent duplicate submissions count once; refresh keeps voted state", async ({ browser, page, baseURL }) => {
    await loginAdmin(page);
    const admin = adminApi(page, baseURL!);
    const roundId = await admin.freshRound();
    const guest = await newGuest(browser);
    await guest.page.goto("/vote");
    // "Back" closes the confirmation without voting; the choice can still change.
    await guest.page.getByTestId("choice-yova").click();
    await guest.page.getByTestId("confirm-back").click();
    await expect(guest.page.getByTestId("confirm-sheet")).toHaveCount(0);
    expect((await admin.state()).total).toBe(0);
    await guest.page.getByTestId("choice-bubu-kosmetik").click();
    // Rapid double tap on the confirm button.
    await guest.page.getByTestId("confirm-vote").dblclick();
    await expect(guest.page.getByTestId("vote-success")).toBeVisible();

    // 15 concurrent duplicate POSTs with the same identity cookie.
    const codes = await guest.page.evaluate(async (id) => {
      const send = () =>
        fetch("/api/vote", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ roundId: id, contestantId: "yova" }),
        }).then((r) => r.json());
      return Promise.all(Array.from({ length: 15 }, send));
    }, roundId);
    expect(codes.every((c: { code: string; contestantId: string }) => c.code === "already_voted" && c.contestantId === "bubu-kosmetik")).toBe(true);

    const state = await admin.state();
    expect(state.total).toBe(1);
    expect(state.results.find((r) => r.contestantId === "bubu-kosmetik")!.votes).toBe(1);

    await guest.page.reload();
    await expect(guest.page.getByTestId("vote-success")).toBeVisible();
    await expect(guest.page.getByTestId("my-choice")).toHaveText("BUBU KOSMETIK");
    await expect(guest.page.getByTestId("vote-form")).toHaveCount(0);
    await guest.context.close();
  });

  test("invalid contestants, cross-site posts and unauthorized admin mutations fail", async ({ page, baseURL }) => {
    await loginAdmin(page);
    const admin = adminApi(page, baseURL!);
    const roundId = await admin.freshRound();

    const anon = await playwrightRequest.newContext({ baseURL });
    await anon.get("/api/vote");
    const bad = await anon.post("/api/vote", { data: { roundId, contestantId: "hacker" }, headers: { Origin: baseURL! } });
    expect(bad.status()).toBe(400);
    expect((await bad.json()).code).toBe("invalid_contestant");

    const crossSite = await anon.post("/api/vote", { data: { roundId, contestantId: "yova" }, headers: { Origin: "https://evil.example" } });
    expect(crossSite.status()).toBe(403);

    const noCookie = await playwrightRequest.newContext({ baseURL });
    const anonymousVote = await noCookie.post("/api/vote", { data: { roundId, contestantId: "yova" }, headers: { Origin: baseURL! } });
    expect(anonymousVote.status()).toBe(401);

    for (const data of [
      { action: "close", roundId },
      { action: "create", label: "hijack", isRehearsal: false },
      { action: "simulate", roundId, count: 50 },
    ]) {
      const res = await anon.post("/api/admin/round", { data, headers: { Origin: baseURL! } });
      expect(res.status(), JSON.stringify(data)).toBe(401);
    }
    expect((await anon.get("/api/admin/rounds")).status()).toBe(401);
    expect((await anon.get(`/api/admin/export?roundId=${roundId}`)).status()).toBe(401);
    // Even a logged-in admin cannot be driven cross-site (CSRF).
    const csrf = await page.request.post("/api/admin/round", { data: { action: "close", roundId }, headers: { Origin: "https://evil.example" } });
    expect(csrf.status()).toBe(403);

    const state = await admin.state();
    expect(state.round!.status).toBe("open");
    expect(state.total).toBe(0);
    await anon.dispose();
    await noCookie.dispose();
  });

  test("voting is refused while waiting and after closing, and the phone shows it", async ({ browser, page, baseURL }) => {
    await loginAdmin(page);
    const admin = adminApi(page, baseURL!);
    const roundId = await admin.freshRound({ open: false });
    const guest = await newGuest(browser);
    await guest.page.goto("/vote");
    await expect(guest.page.getByText("Гласањето наскоро започнува")).toBeVisible();

    const waiting = await voteViaApi(guest.context.request, baseURL!, roundId, "yova");
    expect(waiting.status).toBe(409);
    expect(waiting.body.code).toBe("not_open");

    await admin.post({ action: "open", roundId });
    // The waiting phone picks up the opening automatically (polling).
    await expect(guest.page.getByTestId("vote-form")).toBeVisible({ timeout: 10000 });

    await admin.post({ action: "close", roundId });
    const closed = await voteViaApi(guest.context.request, baseURL!, roundId, "yova");
    expect(closed.status).toBe(409);
    expect(closed.body.code).toBe("not_open");
    await expect(guest.page.getByText("Гласањето е завршено")).toBeVisible({ timeout: 12000 });
    await expect(guest.page.getByText("Нема регистрирани гласови")).toBeVisible();
    expect((await admin.state()).total).toBe(0);
    await guest.context.close();
  });

  test("concurrent votes and closing over HTTP give one consistent final result", async ({ browser, page, baseURL }) => {
    await loginAdmin(page);
    const admin = adminApi(page, baseURL!);
    const roundId = await admin.freshRound();
    const screenCtx = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
    const screen = await screenCtx.newPage();
    await screen.goto("/screen");

    const guests = await Promise.all(Array.from({ length: 150 }, () => playwrightRequest.newContext({ baseURL })));
    await Promise.all(guests.map((g) => g.get("/api/vote")));
    const ids = ["yova", "bubu-kosmetik", "seed-of-life"];
    const votes = guests.map((g, i) =>
      g.post("/api/vote", { data: { roundId, contestantId: ids[i % 3] }, headers: { Origin: baseURL! } }).then(async (r) => (await r.json()).code as string),
    );
    // Fire the close while the vote burst is still in flight.
    const close = new Promise<Awaited<ReturnType<typeof admin.post>>>((resolve) => setTimeout(() => resolve(admin.post({ action: "close", roundId })), 5));
    const [codes, closed] = await Promise.all([Promise.all(votes), close]);
    const accepted = codes.filter((c) => c === "accepted").length;
    expect(codes.every((c) => c === "accepted" || c === "not_open")).toBe(true);
    expect(closed.body.ok).toBe(true);
    const finalTotal = closed.body.state!.total;
    expect(finalTotal).toBe(accepted);
    expect((await admin.state()).total).toBe(accepted);
    console.log(`[measure] concurrent close: ${accepted} accepted before close, ${150 - accepted} rejected after`);

    await expect(screen.getByTestId("screen")).toHaveAttribute("data-status", "closed");
    const table = screen.getByTestId("final-table");
    await expect(table).toBeVisible();
    await Promise.all(guests.map((g) => g.dispose()));
    await screenCtx.close();
  });
});

test.describe("winner reveal", () => {
  test("admin ends voting with confirmation; screen reveals the winner and keeps it after refresh", async ({ browser, page, baseURL }) => {
    await loginAdmin(page);
    const admin = adminApi(page, baseURL!);
    // Create + open through the UI to cover the admin controls.
    const current = await admin.state();
    if (current.round?.status === "open") await admin.post({ action: "close", roundId: current.round.id });
    await page.reload();
    await page.getByTestId("new-round-label").fill("E2E UI рунда");
    await page.getByTestId("new-round-rehearsal").check();
    await page.getByTestId("create-round").click();
    await expect(page.getByTestId("confirm-dialog")).toBeVisible();
    await page.getByTestId("confirm-yes").click();
    await expect(page.getByTestId("round-label")).toHaveText("E2E UI рунда");
    await page.getByTestId("open-voting").click();
    await expect(page.getByTestId("admin-status")).toHaveText("ОТВОРЕНО");

    const screenCtx = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
    const screen = await screenCtx.newPage();
    await screen.goto("/screen");

    const g1 = await newGuest(browser);
    const g2 = await newGuest(browser);
    await voteInUi(g1.page, "seed-of-life");
    await voteInUi(g2.page, "seed-of-life");
    await expect.poll(() => screenVotes(screen, "seed-of-life")).toBe(2);
    await expect(page.getByTestId("admin-row-seed-of-life")).toHaveAttribute("data-votes", "2");

    await page.getByTestId("close-voting").click();
    await expect(page.getByTestId("confirm-dialog")).toContainText("не може да се врати");
    await page.getByTestId("confirm-yes").click();
    await expect(page.getByTestId("admin-status")).toHaveText("ЗАТВОРЕНО");

    await expect(screen.getByText("CONGRATULATIONS!")).toBeVisible({ timeout: 5000 });
    await expect(screen.getByTestId("winner-name")).toHaveText("SEED OF LIFE");
    await expect(screen.getByText("Победник на гласањето на публиката")).toBeVisible();
    await expect(screen.getByTestId("winner-stats")).toHaveText("2 гласови · 100,0%");
    await expect(screen.getByTestId("qr-panel")).toHaveCount(0);

    await screen.reload();
    await expect(screen.getByTestId("winner-name")).toHaveText("SEED OF LIFE");
    await expect(screen.getByTestId("screen")).toHaveAttribute("data-status", "closed");

    await g1.page.reload();
    await expect(g1.page.getByTestId("vote-closed")).toBeVisible();
    await expect(g1.page.getByTestId("vote-winner")).toContainText("SEED OF LIFE");

    // CSV export of the final aggregates.
    const csv = await page.request.get(page.url().replace(/\/admin.*/, "") + (await page.getByTestId("export-csv").getAttribute("href"))!);
    expect(csv.status()).toBe(200);
    const text = await csv.text();
    expect(text).toContain('"SEED OF LIFE","2","100.0","true","false"');
    await screenCtx.close();
    await g1.context.close();
    await g2.context.close();
  });

  test("a first-place tie celebrates all tied winners; zero votes declares no winner", async ({ browser, page, baseURL }) => {
    await loginAdmin(page);
    const admin = adminApi(page, baseURL!);
    const roundId = await admin.freshRound();
    const screenCtx = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
    const screen = await screenCtx.newPage();
    await screen.goto("/screen");

    for (const choice of ["yova", "bubu-kosmetik", "yova", "bubu-kosmetik", "seed-of-life"]) {
      const g = await playwrightRequest.newContext({ baseURL });
      expect((await voteViaApi(g, baseURL!, roundId, choice)).body.code).toBe("accepted");
      await g.dispose();
    }
    await expect(screen.getByTestId("row-yova").getByText("Нерешено", { exact: true })).toBeVisible();
    await expect(screen.getByTestId("row-bubu-kosmetik").getByText("Нерешено", { exact: true })).toBeVisible();
    await expect(screen.getByTestId("row-seed-of-life")).toHaveAttribute("data-leader", "false");
    await expect(screen.getByText("Води", { exact: true })).toHaveCount(0);

    await admin.post({ action: "close", roundId });
    await expect(screen.getByTestId("winner-tie")).toBeVisible();
    await expect(screen.getByText("Нерешено — 2 победници")).toBeVisible();
    await expect(screen.getByTestId("winner-yova")).toBeVisible();
    await expect(screen.getByTestId("winner-bubu-kosmetik")).toBeVisible();
    await expect(screen.getByTestId("winner-seed-of-life")).toHaveCount(0);

    const zero = await admin.freshRound();
    await expect(screen.getByTestId("screen")).toHaveAttribute("data-status", "open");
    await admin.post({ action: "close", roundId: zero });
    await expect(screen.getByTestId("winner-none")).toBeVisible();
    await expect(screen.getByText("Нема регистрирани гласови")).toBeVisible();
    await expect(screen.getByText("CONGRATULATIONS!")).toHaveCount(0);
    await screenCtx.close();
  });
});

test.describe("rounds and resilience", () => {
  test("a fresh round keeps old results and lets the same phone vote again", async ({ browser, page, baseURL }) => {
    await loginAdmin(page);
    const admin = adminApi(page, baseURL!);
    const first = await admin.freshRound({ label: "E2E first" });
    const guest = await newGuest(browser);
    await voteInUi(guest.page, "yova");
    await admin.post({ action: "close", roundId: first });

    const second = await admin.freshRound({ label: "E2E second" });
    expect(second).not.toBe(first);
    await guest.page.reload();
    await expect(guest.page.getByTestId("vote-form")).toBeVisible();
    await guest.page.getByTestId("choice-seed-of-life").click();
    await guest.page.getByTestId("confirm-vote").click();
    await expect(guest.page.getByTestId("vote-success")).toBeVisible();

    const rounds = (await (await page.request.get("/api/admin/rounds")).json()).rounds as (Snapshot & { isActive: boolean })[];
    const r1 = rounds.find((r) => r.round!.id === first)!;
    const r2 = rounds.find((r) => r.round!.id === second)!;
    expect(r1.round!.status).toBe("closed");
    expect(r1.results.find((r) => r.contestantId === "yova")!.votes).toBe(1);
    expect(r2.isActive).toBe(true);
    expect(r2.results.find((r) => r.contestantId === "seed-of-life")!.votes).toBe(1);
    await guest.context.close();
  });

  test("disconnect keeps last results with an indicator; reconnect restores accurate totals", async ({ browser, page, baseURL }) => {
    await loginAdmin(page);
    const admin = adminApi(page, baseURL!);
    const roundId = await admin.freshRound();
    const screenCtx = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
    const screen = await screenCtx.newPage();
    await screen.goto("/screen");
    await expect(screen.getByTestId("connection")).toHaveAttribute("data-connection", "live");

    const g = await playwrightRequest.newContext({ baseURL });
    await voteViaApi(g, baseURL!, roundId, "yova");
    await expect.poll(() => screenVotes(screen, "yova")).toBe(1);

    await screenCtx.setOffline(true);
    await expect(screen.getByTestId("connection")).toHaveAttribute("data-connection", "reconnecting");
    await expect(screen.getByText("Повторно поврзување…")).toBeVisible();

    for (const c of ["yova", "seed-of-life", "seed-of-life"]) {
      const other = await playwrightRequest.newContext({ baseURL });
      await voteViaApi(other, baseURL!, roundId, c);
      await other.dispose();
    }
    await screen.waitForTimeout(1500);
    expect(await screenVotes(screen, "yova")).toBe(1); // last confirmed results preserved
    expect(await screenVotes(screen, "seed-of-life")).toBe(0);

    await screenCtx.setOffline(false);
    await expect.poll(() => screenVotes(screen, "yova"), { timeout: 20000 }).toBe(2);
    await expect.poll(() => screenVotes(screen, "seed-of-life"), { timeout: 20000 }).toBe(2);
    await expect(screen.getByTestId("connection")).toHaveAttribute("data-connection", "live", { timeout: 20000 });
    const state = await admin.state();
    expect(state.total).toBe(4);
    await g.dispose();
    await screenCtx.close();
  });

  test("a closed rehearsal round can be deleted from the console; production rounds cannot", async ({ page, baseURL }) => {
    await loginAdmin(page);
    const admin = adminApi(page, baseURL!);
    const prod = (await (await page.request.get("/api/admin/rounds")).json()).rounds.find(
      (r: Snapshot) => r.round && !r.round.isRehearsal,
    );
    if (prod) expect((await admin.post({ action: "delete", roundId: prod.round.id })).body.code).toBe("not_rehearsal");

    const roundId = await admin.freshRound({ label: "E2E delete me" });
    await admin.post({ action: "simulate", roundId, count: 5 });
    await admin.post({ action: "close", roundId });
    await page.reload();
    await page.getByTestId("delete-round").click();
    await expect(page.getByTestId("confirm-dialog")).toContainText("трајно избришани");
    await page.getByTestId("confirm-yes").click();
    await expect(page.getByTestId("admin-message")).toContainText("избришана");
    await expect(page.getByTestId("round-label")).not.toHaveText("E2E delete me");
    const rounds = (await (await page.request.get("/api/admin/rounds")).json()).rounds as Snapshot[];
    expect(rounds.some((r) => r.round?.id === roundId)).toBe(false);
  });
});
