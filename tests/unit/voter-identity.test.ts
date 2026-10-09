import { describe, expect, it } from "vitest";
import { clientHash, createVoterToken, verifyVoterToken } from "@/lib/voter-identity";

const secret = "x".repeat(40);

describe("voter identity cookie", () => {
  it("round-trips a signed token", () => {
    const { voterId, token } = createVoterToken(secret);
    expect(verifyVoterToken(token, secret)).toBe(voterId);
  });

  it("rejects tampered, foreign and malformed tokens", () => {
    const { token } = createVoterToken(secret);
    const [id, sig] = token.split(".");
    const otherId = "22222222-2222-4222-8222-222222222222";
    expect(verifyVoterToken(`${otherId}.${sig}`, secret)).toBeNull();
    expect(verifyVoterToken(`${id}.${sig}x`, secret)).toBeNull();
    expect(verifyVoterToken(token, "y".repeat(40))).toBeNull();
    expect(verifyVoterToken("garbage", secret)).toBeNull();
    expect(verifyVoterToken(undefined, secret)).toBeNull();
  });

  it("hashes client IPs without exposing them", () => {
    const h = clientHash("203.0.113.5", secret)!;
    expect(h).not.toContain("203");
    expect(h).toBe(clientHash("203.0.113.5", secret));
    expect(clientHash(null, secret)).toBeNull();
  });
});
