import { expect, test } from "@playwright/test";
import { adminApi, loginAdmin, newGuest } from "./helpers";

test.describe("languages", () => {
  test("phones follow the device language and remember a manual choice", async ({ browser, page, baseURL }) => {
    await loginAdmin(page);
    await adminApi(page, baseURL!).freshRound();

    const swede = await newGuest(browser, "sv-SE");
    await swede.page.goto("/vote");
    await expect(swede.page.getByRole("heading", { name: "Rösta på din favorit" })).toBeVisible();
    await expect(swede.page.locator("html")).toHaveAttribute("lang", "sv");

    const other = await newGuest(browser, "de-DE"); // unsupported → Macedonian
    await other.page.goto("/vote");
    await expect(other.page.getByRole("heading", { name: "Гласај за твојот фаворит" })).toBeVisible();

    await other.page.getByTestId("language-switcher").click();
    await other.page.getByTestId("lang-sq").click();
    await expect(other.page.getByRole("heading", { name: "Voto për të preferuarin tënd" })).toBeVisible();
    await other.page.reload();
    await expect(other.page.getByRole("heading", { name: "Voto për të preferuarin tënd" })).toBeVisible();

    await other.page.getByTestId("choice-yova").click();
    await expect(other.page.getByTestId("confirm-vote")).toHaveText("Po, voto");
    await other.page.getByTestId("confirm-vote").click();
    await expect(other.page.getByText("Vota jote u regjistrua me sukses!")).toBeVisible();

    const turk = await newGuest(browser, "tr-TR");
    await turk.page.goto("/vote");
    await expect(turk.page.getByRole("heading", { name: "Favorini oyla" })).toBeVisible();
    await swede.context.close();
    await other.context.close();
    await turk.context.close();
  });

  test("organizers switch the LED language live from /admin", async ({ browser, page, baseURL }) => {
    await loginAdmin(page);
    const admin = adminApi(page, baseURL!);
    await admin.freshRound();
    const screenCtx = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
    const screen = await screenCtx.newPage();
    await screen.goto("/screen");
    await expect(screen.getByTestId("connection")).toHaveAttribute("data-connection", "live");

    await page.reload();
    await page.getByTestId("screen-locale-en").click();
    await expect(screen.getByTestId("screen")).toHaveAttribute("data-locale", "en");
    await expect(screen.getByRole("heading", { name: "Audience vote" })).toBeVisible();
    await expect(screen.getByText("Total votes")).toBeVisible();

    await page.getByTestId("screen-locale-tr").click();
    await expect(screen.getByRole("heading", { name: "Seyirci oylaması" })).toBeVisible();
    await screen.reload(); // persisted server-side
    await expect(screen.getByRole("heading", { name: "Seyirci oylaması" })).toBeVisible();

    await page.getByTestId("screen-locale-mk").click();
    await expect(screen.getByRole("heading", { name: "Гласање на публиката" })).toBeVisible();
    await screenCtx.close();
  });
});
