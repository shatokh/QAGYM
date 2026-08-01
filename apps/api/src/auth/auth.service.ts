import { Injectable } from "@nestjs/common";
import argon2 from "argon2";
import {
  INVALID_CREDENTIALS_DELAY_MS,
  SESSION_ABSOLUTE_TIMEOUT_SECONDS,
  SESSION_IDLE_TIMEOUT_SECONDS,
} from "./auth.constants";
import type { LoginBody } from "./auth.schemas";
import type { AuthUserDto, LoginResult } from "./auth.types";
import { LoginThrottleService } from "./login-throttle.service";
import {
  createSessionToken,
  hashSessionToken,
  isPlausibleSessionToken,
} from "./session-cookie";
import { PrismaService } from "../database/prisma.service";
import type { UserRole } from "../generated/prisma/enums";
import {
  authRateLimited,
  invalidCredentials,
  unauthenticated,
} from "../http/api-exception";

interface AuthUserRecord {
  id: number;
  publicId: string;
  email: string;
  passwordHash: string;
  displayName: string;
  role: UserRole;
  enabled: boolean;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly loginThrottle: LoginThrottleService,
  ) {}

  async login(
    body: LoginBody,
    source: string,
  ): Promise<LoginResult> {
    const now = new Date();

    if (this.loginThrottle.isLimited(body.email, source, now)) {
      throw authRateLimited();
    }

    const user = await this.prisma.user.findUnique({
      where: { email: body.email },
      select: {
        id: true,
        publicId: true,
        email: true,
        passwordHash: true,
        displayName: true,
        role: true,
        enabled: true,
      },
    });

    const passwordValid = user
      ? await this.verifyPassword(user.passwordHash, body.password)
      : false;

    if (!user || !user.enabled || !passwordValid) {
      this.loginThrottle.recordFailure(body.email, source, now);
      await this.invalidCredentialsDelay();
      throw invalidCredentials();
    }

    this.loginThrottle.clearEmail(body.email);

    const sessionToken = createSessionToken();
    const expiresAt = new Date(
      now.getTime() + SESSION_ABSOLUTE_TIMEOUT_SECONDS * 1000,
    );

    await this.prisma.session.create({
      data: {
        userId: user.id,
        tokenHash: hashSessionToken(sessionToken),
        expiresAt,
        lastSeenAt: now,
      },
    });

    return {
      user: this.toUserDto(user),
      sessionToken,
      maxAgeSeconds: SESSION_ABSOLUTE_TIMEOUT_SECONDS,
    };
  }

  async currentUser(sessionToken: string | undefined): Promise<AuthUserDto> {
    const session = await this.findValidSession(sessionToken);

    await this.prisma.session.update({
      where: { id: session.id },
      data: { lastSeenAt: new Date() },
    });

    return this.toUserDto(session.user);
  }

  async logout(sessionToken: string | undefined): Promise<void> {
    if (!isPlausibleSessionToken(sessionToken)) {
      return;
    }

    await this.prisma.session.updateMany({
      where: {
        tokenHash: hashSessionToken(sessionToken),
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });
  }

  private async findValidSession(sessionToken: string | undefined) {
    if (!isPlausibleSessionToken(sessionToken)) {
      throw unauthenticated();
    }

    const now = new Date();
    const session = await this.prisma.session.findUnique({
      where: { tokenHash: hashSessionToken(sessionToken) },
      select: {
        id: true,
        expiresAt: true,
        lastSeenAt: true,
        revokedAt: true,
        user: {
          select: {
            id: true,
            publicId: true,
            email: true,
            passwordHash: true,
            displayName: true,
            role: true,
            enabled: true,
          },
        },
      },
    });

    if (
      !session ||
      session.revokedAt ||
      session.expiresAt.getTime() <= now.getTime() ||
      session.lastSeenAt.getTime() <=
        now.getTime() - SESSION_IDLE_TIMEOUT_SECONDS * 1000 ||
      !session.user.enabled
    ) {
      throw unauthenticated();
    }

    return session;
  }

  private async verifyPassword(
    passwordHash: string,
    password: string,
  ): Promise<boolean> {
    try {
      return await argon2.verify(passwordHash, password);
    } catch {
      return false;
    }
  }

  private async invalidCredentialsDelay(): Promise<void> {
    await new Promise((resolve) =>
      setTimeout(resolve, INVALID_CREDENTIALS_DELAY_MS),
    );
  }

  private toUserDto(user: AuthUserRecord): AuthUserDto {
    return {
      id: user.publicId,
      email: user.email,
      displayName: user.displayName,
      role: user.role,
    };
  }
}
