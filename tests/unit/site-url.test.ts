import { describe, expect, it } from "vitest";
import { checkSiteUrl } from "@/lib/site-url";

describe("checkSiteUrl", () => {
  it("builds the vote URL from a public HTTPS domain", () => {
    const r = checkSiteUrl("https://glasaj.biznisarena.mk/", true);
    expect(r).toMatchObject({ ok: true, voteUrl: "https://glasaj.biznisarena.mk/vote", displayUrl: "glasaj.biznisarena.mk/vote", warning: null });
  });

  it("rejects localhost, private IPs and plain http in production", () => {
    for (const url of ["http://localhost:3000", "https://127.0.0.1", "https://192.168.1.20", "http://glasaj.biznisarena.mk", "https://app.localhost"]) {
      const r = checkSiteUrl(url, true);
      expect(r.ok, url).toBe(false);
      expect(r.error, url).toBeTruthy();
    }
  });

  it("allows but flags local URLs outside production", () => {
    const r = checkSiteUrl("http://192.168.1.20:3000", false);
    expect(r.ok).toBe(true);
    expect(r.voteUrl).toBe("http://192.168.1.20:3000/vote");
    expect(r.warning).toBeTruthy();
  });

  it("requires a value", () => {
    expect(checkSiteUrl(undefined, false).ok).toBe(false);
    expect(checkSiteUrl("not a url", false).ok).toBe(false);
    expect(checkSiteUrl("ftp://x.mk", false).ok).toBe(false);
  });
});
