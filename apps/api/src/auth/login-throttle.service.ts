import { Injectable } from "@nestjs/common";
import {
  LOGIN_EMAIL_ATTEMPT_LIMIT,
  LOGIN_SOURCE_ATTEMPT_LIMIT,
  LOGIN_THROTTLE_WINDOW_SECONDS,
} from "./auth.constants";

interface AttemptBucket {
  count: number;
  resetAt: number;
}

@Injectable()
export class LoginThrottleService {
  private readonly buckets = new Map<string, AttemptBucket>();

  isLimited(email: string, source: string, now = new Date()): boolean {
    return (
      this.countFor(`email:${email}`, now) >= LOGIN_EMAIL_ATTEMPT_LIMIT ||
      this.countFor(`source:${source}`, now) >= LOGIN_SOURCE_ATTEMPT_LIMIT
    );
  }

  recordFailure(email: string, source: string, now = new Date()): void {
    this.increment(`email:${email}`, now);
    this.increment(`source:${source}`, now);
  }

  clearEmail(email: string): void {
    this.buckets.delete(`email:${email}`);
  }

  resetForTesting(): void {
    this.buckets.clear();
  }

  private countFor(key: string, now: Date): number {
    const bucket = this.buckets.get(key);

    if (!bucket || bucket.resetAt <= now.getTime()) {
      this.buckets.delete(key);
      return 0;
    }

    return bucket.count;
  }

  private increment(key: string, now: Date): void {
    const nowMs = now.getTime();
    const existing = this.buckets.get(key);

    if (!existing || existing.resetAt <= nowMs) {
      this.buckets.set(key, {
        count: 1,
        resetAt: nowMs + LOGIN_THROTTLE_WINDOW_SECONDS * 1000,
      });
      return;
    }

    existing.count += 1;
  }
}
