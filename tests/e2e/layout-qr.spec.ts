import { expect, test, type Page } from "@playwright/test";
import jsQR from "jsqr";
import { PNG } from "pngjs";
import { adminApi, loginAdmin } from "./helpers";

function decodeQr(png: Buffer): string | null {
  const image = PNG.sync.read(png);
  return jsQR(new Uint8ClampedArray(image.data), image.width, image.height)?.data ?? null;
}

async function noScrollOrClipping(page: Page, selectors: string[]) {
  const result = await page.evaluate((sels) => {
    const de = document.documentElement;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const outside = sels.flatMap((s) =>
      [...document.querySelectorAll<HTMLElement>(s)]
        .map((el) => ({ s, r: el.getBoundingClientRect() }))
        .filter(({ r }) => r.width > 0 && (r.left < -1 || r.top < -1 || r.right > vw + 1 || r.bottom > vh + 1))
        .map(({ s, r }) => `${s} @ ${Math.round(r.left)},${Math.round(r.top)},${Math.round(r.right)},${Math.round(r.bottom)}`),
    );
    // Text that is cut off by overflow/ellipsis.
    const truncated = [...document.querySelectorAll<HTMLElement>("[data-testid^=row-] span")]
      .filter((el) => el.scrollWidth > el.clientWidth + 1)
      .map((el) => el.textContent);
    return { scrollW: de.scrollWidth, scrollH: de.scrollHeight, vw, vh, outside, truncated };
  }, selectors);
  expect(result.scrollW, "horizontal scroll").toBeLessThanOrEqual(result.vw);
  expect(result.scrollH, "vertical scroll").toBeLessThanOrEqual(result.vh);
  expect(result.outside).toEqual([]);
  expect(result.truncated).toEqual([]);
}

test.describe("layout and QR", () => {
  test("QR endpoint and the on-screen QR encode the public /vote URL", async ({ page, baseURL }) => {
    const expected = `${baseURL}/vote`;
    const png = await page.request.get("/api/qr?format=png");
    expect(png.status()).toBe(200);
    expect(decodeQr(await png.body())).toBe(expected);

    await page.setViewportSize({ width: 1920, height: 1080 });
    await loginAdmin(page);
    await adminApi(page, baseURL!).freshRound();
    await page.goto("/screen");
    const qr = page.getByTestId("qr-code");
    await expect(qr).toBeVisible();
    expect(decodeQr(await qr.screenshot())).toBe(expected);
    await expect(page.getByTestId("vote-url")).toHaveText(expected.replace(/^https?:\/\//, ""));
  });

  for (const size of [
    { width: 1920, height: 1080 },
    { width: 1280, height: 720 },
    { width: 2560, height: 1440 },
    { width: 1920, height: 1200 },
  ]) {
    test(`LED screen fits ${size.width}x${size.height} without scrolling or clipping (open + winner)`, async ({ page, baseURL }) => {
      await loginAdmin(page);
      const admin = adminApi(page, baseURL!);
      const roundId = await admin.freshRound();
      // Longest name leads, to stress the winner typography.
      await admin.post({ action: "simulate", roundId, count: 30 });
      await page.setViewportSize(size);
      await page.goto("/screen");
      await expect(page.getByTestId("qr-panel")).toBeVisible();
      await noScrollOrClipping(page, ["[data-testid=qr-panel]", "[data-testid^=row-]", "header", "footer"]);
      await page.screenshot({ path: test.info().outputPath(`screen-open-${size.width}x${size.height}.png`) });

      await admin.post({ action: "close", roundId });
      await expect(page.getByText("CONGRATULATIONS!")).toBeVisible();
      await page.waitForTimeout(1200); // entrance animation
      await noScrollOrClipping(page, ["[data-testid=final-table]", "header"]);
      await page.screenshot({ path: test.info().outputPath(`screen-winner-${size.width}x${size.height}.png`) });
    });
  }

  for (const size of [
    { width: 390, height: 844 },
    { width: 375, height: 667 },
    { width: 360, height: 740 },
  ]) {
    test(`mobile voting fits ${size.width}x${size.height}`, async ({ browser, page, baseURL }) => {
      await loginAdmin(page);
      await adminApi(page, baseURL!).freshRound();
      const ctx = await browser.newContext({ viewport: size, isMobile: true, hasTouch: true });
      const phone = await ctx.newPage();
      await phone.goto("/vote");
      await expect(phone.getByTestId("vote-form")).toBeVisible();
      await noScrollOrClipping(phone, ["[data-testid^=choice-]", "h1", "[data-testid=language-switcher]"]);
      await phone.screenshot({ path: test.info().outputPath(`vote-${size.width}x${size.height}.png`) });
      await phone.getByTestId("choice-bubu-kosmetik").tap();
      await expect(phone.getByTestId("confirm-vote")).toBeVisible();
      await phone.waitForTimeout(500); // sheet entrance
      await noScrollOrClipping(phone, ["[data-testid=confirm-vote]", "[data-testid=confirm-back]", "[data-testid=confirm-name]"]);
      await phone.screenshot({ path: test.info().outputPath(`confirm-${size.width}x${size.height}.png`) });
      await phone.getByTestId("confirm-vote").tap();
      await expect(phone.getByTestId("vote-success")).toBeVisible();
      await noScrollOrClipping(phone, ["h1", "[data-testid=my-choice]"]);
      await ctx.close();
    });
  }
});
