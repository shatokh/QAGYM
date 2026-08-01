import {
  createSessionClearCookieHeader,
  createSessionSetCookieHeader,
  createSessionToken,
  hashSessionToken,
  isPlausibleSessionToken,
  readSessionCookie,
} from "./session-cookie";

describe("session cookie helpers", () => {
  it("creates opaque base64url session tokens and stable hashes", () => {
    const token = createSessionToken();

    expect(isPlausibleSessionToken(token)).toBe(true);
    expect(token).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(token.length).toBeGreaterThanOrEqual(22);
    expect(hashSessionToken(token)).toMatch(/^[a-f0-9]{64}$/);
    expect(hashSessionToken(token)).toBe(hashSessionToken(token));
  });

  it("reads the qcg_session cookie without parsing unrelated cookies", () => {
    expect(
      readSessionCookie("theme=dark; qcg_session=abc123; locale=en"),
    ).toBe("abc123");
    expect(readSessionCookie(["theme=dark", "qcg_session=xyz"])).toBe(
      "xyz",
    );
    expect(readSessionCookie("theme=dark")).toBeUndefined();
  });

  it("serializes local MVP set and clear cookie attributes", () => {
    expect(createSessionSetCookieHeader("abc123")).toBe(
      "qcg_session=abc123; Max-Age=28800; Path=/; HttpOnly; SameSite=Lax",
    );
    expect(createSessionClearCookieHeader()).toBe(
      "qcg_session=; Max-Age=0; Path=/; HttpOnly; SameSite=Lax",
    );
  });
});
