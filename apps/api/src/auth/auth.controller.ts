import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  Res,
} from "@nestjs/common";
import { AuthService } from "./auth.service";
import {
  assertJsonRequest,
  parseLoginBody,
  parseLogoutBody,
  type HeaderBag,
} from "./auth.schemas";
import type { AuthUserResponse } from "./auth.types";
import {
  createSessionClearCookieHeader,
  createSessionSetCookieHeader,
  readSessionCookie,
} from "./session-cookie";

interface HttpRequest {
  headers: HeaderBag & {
    cookie?: string | string[];
  };
  ip?: string;
  socket?: {
    remoteAddress?: string;
  };
}

interface HttpResponse {
  setHeader(name: string, value: string): void;
}

@Controller("api/v1/auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("login")
  @HttpCode(200)
  async login(
    @Body() body: unknown,
    @Req() request: HttpRequest,
    @Res({ passthrough: true }) response: HttpResponse,
  ): Promise<AuthUserResponse> {
    assertJsonRequest(request.headers);

    const result = await this.authService.login(
      parseLoginBody(body),
      clientSource(request),
    );

    response.setHeader(
      "Set-Cookie",
      createSessionSetCookieHeader(result.sessionToken),
    );

    return {
      data: {
        user: result.user,
      },
    };
  }

  @Post("logout")
  @HttpCode(204)
  async logout(
    @Body() body: unknown,
    @Req() request: HttpRequest,
    @Res({ passthrough: true }) response: HttpResponse,
  ): Promise<void> {
    assertJsonRequest(request.headers, {
      allowEmptyWithoutContentType: true,
    });
    parseLogoutBody(body ?? {});

    await this.authService.logout(readSessionCookie(request.headers.cookie));
    response.setHeader("Set-Cookie", createSessionClearCookieHeader());
  }

  @Get("me")
  async me(@Req() request: HttpRequest): Promise<AuthUserResponse> {
    const user = await this.authService.currentUser(
      readSessionCookie(request.headers.cookie),
    );

    return {
      data: {
        user,
      },
    };
  }
}

function clientSource(request: HttpRequest): string {
  return request.ip ?? request.socket?.remoteAddress ?? "unknown";
}
