import { expect, request, test } from "@playwright/test";

test.describe("clean auth API runtime smoke", () => {
  test("logs in, reads current user, logs out, and rejects invalid credentials", async () => {
    const api = await request.newContext({
      baseURL: "http://127.0.0.1:3000",
    });

    try {
      const health = await api.get("/health");
      expect(health.ok()).toBe(true);
      expect(await health.json()).toEqual({ status: "ok" });

      const login = await api.post("/api/v1/auth/login", {
        data: {
          email: "user@qacomics.local",
          password: "DemoUserPassphrase2026!",
        },
      });
      expect(login.status()).toBe(200);
      expect(login.headers()["set-cookie"]).toContain("qcg_session=");
      expect(login.headers()["set-cookie"]).toContain("HttpOnly");
      expect(await login.json()).toEqual({
        data: {
          user: {
            id: "usr_demo_user",
            email: "user@qacomics.local",
            displayName: "Demo User",
            role: "USER",
          },
        },
      });

      const currentUser = await api.get("/api/v1/auth/me");
      expect(currentUser.status()).toBe(200);
      expect(await currentUser.json()).toEqual({
        data: {
          user: {
            id: "usr_demo_user",
            email: "user@qacomics.local",
            displayName: "Demo User",
            role: "USER",
          },
        },
      });

      const logout = await api.post("/api/v1/auth/logout", {
        data: {},
      });
      expect(logout.status()).toBe(204);
      expect(logout.headers()["set-cookie"]).toContain("Max-Age=0");

      const afterLogout = await api.get("/api/v1/auth/me");
      expect(afterLogout.status()).toBe(401);
      expect(await afterLogout.json()).toEqual({
        error: {
          code: "UNAUTHENTICATED",
          message: "Authentication required.",
          details: [],
        },
      });

      const invalidLogin = await api.post("/api/v1/auth/login", {
        data: {
          email: "unknown@qacomics.local",
          password: "not-the-demo-password",
        },
      });
      expect(invalidLogin.status()).toBe(401);
      expect(await invalidLogin.json()).toEqual({
        error: {
          code: "INVALID_CREDENTIALS",
          message: "Invalid email or password.",
          details: [],
        },
      });
    } finally {
      await api.dispose();
    }
  });
});
