import { createHash, randomBytes } from "node:crypto";
import {
  SESSION_ABSOLUTE_TIMEOUT_SECONDS,
  SESSION_COOKIE_NAME,
} from "./auth.constants";

const BASE64URL_PATTERN = /^[A-Za-z0-9_-]+$/;
const MIN_TOKEN_LENGTH = 22;
const MAX_TOKEN_LENGTH = 512;

export function createSessionToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashSessionToken(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

export function isPlausibleSessionToken(token: string | undefined): token is string {
  return (
    typeof token === "string" &&
    token.length >= MIN_TOKEN_LENGTH &&
    token.length <= MAX_TOKEN_LENGTH &&
    BASE64URL_PATTERN.test(token)
  );
}

export function readSessionCookie(
  cookieHeader: string | string[] | undefined,
): string | undefined {
  const header = Array.isArray(cookieHeader)
    ? cookieHeader.join("; ")
    : cookieHeader;

  if (!header) {
    return undefined;
  }

  for (const cookie of header.split(";")) {
    const [rawName, ...rawValue] = cookie.trim().split("=");
    if (rawName === SESSION_COOKIE_NAME) {
      return rawValue.join("=");
    }
  }

  return undefined;
}

export function createSessionSetCookieHeader(token: string): string {
  return [
    `${SESSION_COOKIE_NAME}=${token}`,
    `Max-Age=${SESSION_ABSOLUTE_TIMEOUT_SECONDS}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
  ].join("; ");
}

export function createSessionClearCookieHeader(): string {
  return [
    `${SESSION_COOKIE_NAME}=`,
    "Max-Age=0",
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
  ].join("; ");
}
