import { Controller, Get, Param, Query } from "@nestjs/common";
import {
  parseCatalogDetailQuery,
  parseCatalogListQuery,
  parseComicSlug,
} from "./catalog.schemas";
import { CatalogService } from "./catalog.service";
import type {
  CatalogDetailResponse,
  CatalogListResponse,
} from "./catalog.types";

@Controller("api/v1/comics")
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  @Get()
  list(@Query() query: unknown): Promise<CatalogListResponse> {
    return this.catalogService.list(parseCatalogListQuery(query));
  }

  @Get(":slug")
  detail(
    @Param("slug") slug: unknown,
    @Query() query: unknown,
  ): Promise<CatalogDetailResponse> {
    return this.catalogService.detail(
      parseComicSlug(slug),
      parseCatalogDetailQuery(query),
    );
  }
}
