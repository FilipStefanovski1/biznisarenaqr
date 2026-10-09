import { describe, expect, it } from "vitest";
import { detectLocale, formatNumber, formatPercentFor, LOCALES, MESSAGES } from "@/i18n/messages";

describe("translations", () => {
  it("every language defines every message", () => {
    const keys = Object.keys(MESSAGES.mk).sort();
    for (const locale of LOCALES) {
      expect(Object.keys(MESSAGES[locale]).sort(), locale).toEqual(keys);
      for (const [key, value] of Object.entries(MESSAGES[locale])) {
        const text = typeof value === "function" ? value(2 as never) : value;
        expect(String(text).trim().length, `${locale}.${key}`).toBeGreaterThan(0);
      }
    }
  });

  it("keeps the requested Macedonian headlines", () => {
    expect(MESSAGES.mk.heading).toBe("Гласај за твојот фаворит");
    expect(MESSAGES.mk.successTitle).toBe("Твојот глас е успешно регистриран!");
    expect(MESSAGES.mk.successThanks).toBe("Ти благодариме што гласаше.");
    expect(MESSAGES.mk.waitingTitle).toBe("Гласањето наскоро започнува");
    expect(MESSAGES.mk.closedTitle).toBe("Гласањето е завршено");
    expect(MESSAGES.mk.noVotes).toBe("Нема регистрирани гласови");
    expect(MESSAGES.mk.winnerLabel).toBe("Победник на гласањето на публиката");
  });

  it("detects the device language with a Macedonian fallback", () => {
    expect(detectLocale(["sv-SE", "en"])).toBe("sv");
    expect(detectLocale(["de-DE", "tr-TR"])).toBe("tr");
    expect(detectLocale(["sq-AL"])).toBe("sq");
    expect(detectLocale(["fr-FR"])).toBe("mk");
    expect(detectLocale([])).toBe("mk");
  });

  it("formats numbers per language", () => {
    expect(formatNumber(12345, "mk")).toBe("12.345");
    expect(formatNumber(12345, "en")).toBe("12,345");
    expect(formatPercentFor(48.24, "en")).toBe("48.2%");
    expect(formatPercentFor(48.24, "mk")).toBe("48,2%");
    expect(formatPercentFor(48.24, "tr")).toBe("%48,2");
    expect(formatPercentFor(48.24, "sv")).toBe("48,2 %");
    expect(MESSAGES.en.votes(1)).toBe("vote");
    expect(MESSAGES.sv.votes(3)).toBe("röster");
  });
});
