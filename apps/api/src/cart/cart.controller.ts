import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
  Req,
} from "@nestjs/common";
import { AuthService, type AuthenticatedSession } from "../auth/auth.service";
import {
  assertJsonRequest,
  type HeaderBag,
} from "../auth/auth.schemas";
import { readSessionCookie } from "../auth/session-cookie";
import type { UserRole } from "../generated/prisma/enums";
import { forbidden } from "../http/api-exception";
import {
  parseAddCartLineBody,
  parseCartComicSlug,
  parseCartQuery,
  parseEmptyCartQuery,
  parseUpdateCartLineBody,
} from "./cart.schemas";
import { CartService } from "./cart.service";
import type { CartResponse, CsrfTokenResponse } from "./cart.types";
import { CsrfTokenService } from "./csrf-token.service";

interface HttpRequest {
  headers: HeaderBag & {
    cookie?: string | string[];
    "x-qcg-csrf-token"?: string | string[];
  };
}

@Controller("api/v1")
export class CartController {
  constructor(
    private readonly authService: AuthService,
    private readonly cartService: CartService,
    private readonly csrfTokenService: CsrfTokenService,
  ) {}

  @Get("csrf-token")
  async csrfToken(
    @Req() request: HttpRequest,
    @Query() query: unknown,
  ): Promise<CsrfTokenResponse> {
    parseEmptyCartQuery(query);
    const session = await this.requireBuyerSession(request);

    return {
      data: {
        csrfToken: this.csrfTokenService.create(session.tokenHash),
      },
    };
  }

  @Get("cart")
  async cart(
    @Req() request: HttpRequest,
    @Query() query: unknown,
  ): Promise<CartResponse> {
    const session = await this.requireBuyerSession(request);

    return this.cartService.getCart(
      session,
      parseCartQuery(query).locale,
    );
  }

  @Post("cart/lines")
  @HttpCode(200)
  async addLine(
    @Body() body: unknown,
    @Req() request: HttpRequest,
    @Query() query: unknown,
  ): Promise<CartResponse> {
    assertJsonRequest(request.headers);

    const session = await this.requireBuyerSession(request);
    this.assertCsrf(request, session);
    parseEmptyCartQuery(query);

    return this.cartService.addLine(
      session,
      "en",
      parseAddCartLineBody(body),
    );
  }

  @Patch("cart/lines/:comicSlug")
  async updateLine(
    @Body() body: unknown,
    @Param("comicSlug") comicSlug: string,
    @Req() request: HttpRequest,
    @Query() query: unknown,
  ): Promise<CartResponse> {
    assertJsonRequest(request.headers);

    const session = await this.requireBuyerSession(request);
    this.assertCsrf(request, session);
    parseEmptyCartQuery(query);

    return this.cartService.updateLine(
      session,
      "en",
      parseCartComicSlug(comicSlug),
      parseUpdateCartLineBody(body),
    );
  }

  @Delete("cart/lines/:comicSlug")
  @HttpCode(204)
  async removeLine(
    @Param("comicSlug") comicSlug: string,
    @Req() request: HttpRequest,
    @Query() query: unknown,
  ): Promise<void> {
    parseEmptyCartQuery(query);
    const session = await this.requireBuyerSession(request);
    this.assertCsrf(request, session);

    await this.cartService.removeLine(
      session,
      parseCartComicSlug(comicSlug),
    );
  }

  private async requireBuyerSession(
    request: HttpRequest,
  ): Promise<AuthenticatedSession> {
    const session = await this.authService.requireSession(
      readSessionCookie(request.headers.cookie),
    );

    if (session.user.role !== ("USER" satisfies UserRole)) {
      throw forbidden();
    }

    return session;
  }

  private assertCsrf(
    request: HttpRequest,
    session: AuthenticatedSession,
  ): void {
    this.csrfTokenService.assertValid(
      session.tokenHash,
      request.headers["x-qcg-csrf-token"],
    );
  }
}
