import { Module } from "@nestjs/common";
import { APP_FILTER } from "@nestjs/core";
import { CatalogModule } from "./catalog/catalog.module";
import { HealthController } from "./health/health.controller";
import { ApiErrorFilter } from "./http/api-error.filter";

@Module({
  imports: [CatalogModule],
  controllers: [HealthController],
  providers: [
    {
      provide: APP_FILTER,
      useClass: ApiErrorFilter,
    },
  ],
})
export class AppModule {}
