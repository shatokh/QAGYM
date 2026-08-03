import { Injectable } from "@nestjs/common";
import { randomBytes, createHash } from "node:crypto";
import { csrfTokenInvalid } from "../http/api-exception";

const CSRF_TOKEN_BYTES = 32;
const CSRF_TOKEN_TTL_MS = 8 * 60 * 60 * 1000;

interface StoredCsrfToken {
  tokenHash: string;
  expiresAt: number;
}

@Injectable()
export class CsrfTokenService {
  private readonly tokensBySessionHash = new Map<string, StoredCsrfToken>();

  create(sessionTokenHash: string): string {
    const token = randomBytes(CSRF_TOKEN_BYTES).toString("base64url");

    this.tokensBySessionHash.set(sessionTokenHash, {
      tokenHash: this.hash(token),
      expiresAt: Date.now() + CSRF_TOKEN_TTL_MS,
    });

    return token;
  }

  assertValid(
    sessionTokenHash: string,
    headerValue: string | string[] | undefined,
  ): void {
    const token = Array.isArray(headerValue) ? headerValue[0] : headerValue;
    const stored = this.tokensBySessionHash.get(sessionTokenHash);

    if (
      !token ||
      !stored ||
      stored.expiresAt <= Date.now() ||
      stored.tokenHash !== this.hash(token)
    ) {
      if (stored && stored.expiresAt <= Date.now()) {
        this.tokensBySessionHash.delete(sessionTokenHash);
      }

      throw csrfTokenInvalid();
    }
  }

  resetForTesting(): void {
    this.tokensBySessionHash.clear();
  }

  private hash(token: string): string {
    return createHash("sha256").update(token).digest("hex");
  }
}
