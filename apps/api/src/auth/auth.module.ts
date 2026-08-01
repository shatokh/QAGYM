import { Module } from "@nestjs/common";
import { DatabaseModule } from "../database/database.module";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { LoginThrottleService } from "./login-throttle.service";

@Module({
  imports: [DatabaseModule],
  controllers: [AuthController],
  providers: [AuthService, LoginThrottleService],
})
export class AuthModule {}
