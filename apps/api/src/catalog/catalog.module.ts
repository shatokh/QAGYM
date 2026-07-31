import { Module } from "@nestjs/common";
import { DatabaseModule } from "../database/database.module";
import { CatalogController } from "./catalog.controller";
import { CatalogFiltersController } from "./catalog-filters.controller";
import { CatalogService } from "./catalog.service";

@Module({
  imports: [DatabaseModule],
  controllers: [CatalogController, CatalogFiltersController],
  providers: [CatalogService],
})
export class CatalogModule {}
