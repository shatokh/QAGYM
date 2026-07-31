import { Controller, Get, Query } from "@nestjs/common";
import { parseCatalogFilterOptionsQuery } from "./catalog.schemas";
import { CatalogService } from "./catalog.service";
import type { CatalogFilterOptionsResponse } from "./catalog.types";

@Controller("api/v1/catalog")
export class CatalogFiltersController {
  constructor(private readonly catalogService: CatalogService) {}

  @Get("filter-options")
  filterOptions(@Query() query: unknown): Promise<CatalogFilterOptionsResponse> {
    return this.catalogService.filterOptions(
      parseCatalogFilterOptionsQuery(query),
    );
  }
}
