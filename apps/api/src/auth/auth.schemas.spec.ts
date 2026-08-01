import {
  assertJsonRequest,
  parseLoginBody,
  parseLogoutBody,
} from "./auth.schemas";

describe("auth schemas", () => {
  it("normalizes valid login input", () => {
    expect(
      parseLoginBody({
        email: " USER@QACOMICS.LOCAL ",
        password: "DemoUserPassphrase2026!",
      }),
    ).toEqual({
      email: "user@qacomics.local",
      password: "DemoUserPassphrase2026!",
    });
  });

  it("returns deterministic login validation details", () => {
    expect(() =>
      parseLoginBody({
        email: "not-an-email",
        password: "",
        extra: "value",
      }),
    ).toThrow(
      expect.objectContaining({
        response: {
          error: {
            code: "INVALID_REQUEST",
            message: "Request validation failed.",
            details: [
              {
                path: "email",
                message: "Expected a valid email address.",
              },
              {
                path: "extra",
                message: "Unknown body field.",
              },
              {
                path: "password",
                message: "Expected a non-empty string.",
              },
            ],
          },
        },
      }),
    );
  });

  it("rejects unknown logout body fields", () => {
    expect(() => parseLogoutBody({ extra: "value" })).toThrow(
      expect.objectContaining({
        response: {
          error: {
            code: "INVALID_REQUEST",
            message: "Request validation failed.",
            details: [
              {
                path: "extra",
                message: "Unknown body field.",
              },
            ],
          },
        },
      }),
    );
  });

  it("requires JSON content type for login writes", () => {
    expect(() => assertJsonRequest({})).toThrow(
      expect.objectContaining({
        response: {
          error: {
            code: "INVALID_REQUEST",
            message: "Request validation failed.",
            details: [
              {
                path: "contentType",
                message: "Expected application/json.",
              },
            ],
          },
        },
      }),
    );

    expect(() =>
      assertJsonRequest({ "content-type": "application/json; charset=utf-8" }),
    ).not.toThrow();
  });
});
