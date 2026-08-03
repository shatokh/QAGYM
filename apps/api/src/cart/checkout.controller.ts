import {
  Body,
  Controller,
  Get,
  Param,
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
  parseCheckoutBody,
  parseCheckoutQuery,
  parseOrderListQuery,
  parseOrderNumber,
} from "./checkout.schemas";
import { CheckoutService } from "./checkout.service";
import type {
  CheckoutResponse,
  OrderDetailResponse,
  OrderListResponse,
} from "./checkout.types";
import { CsrfTokenService } from "./csrf-token.service";

interface HttpRequest {
  headers: HeaderBag & {
    cookie?: string | string[];
    "x-qcg-csrf-token"?: string | string[];
  };
}

@Controller("api/v1")
export class CheckoutController {
  constructor(
    private readonly authService: AuthService,
    private readonly checkoutService: CheckoutService,
    private readonly csrfTokenService: CsrfTokenService,
  ) {}

  @Post("checkout")
  async checkout(
    @Body() body: unknown,
    @Req() request: HttpRequest,
    @Query() query: unknown,
  ): Promise<CheckoutResponse> {
    assertJsonRequest(request.headers);

    const session = await this.requireBuyerSession(request);
    this.assertCsrf(request, session);

    return this.checkoutService.checkout(
      session,
      parseCheckoutQuery(query).locale,
      parseCheckoutBody(body),
    );
  }

  @Get("orders")
  async orders(
    @Req() request: HttpRequest,
    @Query() query: unknown,
  ): Promise<OrderListResponse> {
    const session = await this.requireBuyerSession(request);

    return this.checkoutService.listOrders(
      session,
      parseOrderListQuery(query),
    );
  }

  @Get("orders/:orderNumber")
  async orderDetail(
    @Param("orderNumber") orderNumber: string,
    @Req() request: HttpRequest,
  ): Promise<OrderDetailResponse> {
    const session = await this.requireBuyerSession(request);

    return this.checkoutService.orderDetail(
      session,
      parseOrderNumber(orderNumber),
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
