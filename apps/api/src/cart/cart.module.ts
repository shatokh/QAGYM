import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { DatabaseModule } from "../database/database.module";
import { CartController } from "./cart.controller";
import { CartService } from "./cart.service";
import { CheckoutController } from "./checkout.controller";
import { CheckoutService } from "./checkout.service";
import { CsrfTokenService } from "./csrf-token.service";

@Module({
  imports: [AuthModule, DatabaseModule],
  controllers: [CartController, CheckoutController],
  providers: [CartService, CheckoutService, CsrfTokenService],
})
export class CartModule {}
