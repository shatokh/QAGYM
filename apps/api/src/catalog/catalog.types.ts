import type { CatalogLocale } from "./catalog.schemas";

export interface CatalogMoney {
  amountMinor: number;
  currencyCode: string;
}

export interface CatalogStock {
  quantity: number;
  inStock: boolean;
}

export interface CatalogSeries {
  slug: string;
  title: string;
  contentLocale: CatalogLocale;
  issueNumber: number;
}

export interface CatalogCreator {
  slug: string;
  displayName: string;
  role: "WRITER" | "ARTIST";
}

export interface CatalogGenre {
  slug: string;
  name: string;
  contentLocale: CatalogLocale;
}

export interface CatalogListItem {
  slug: string;
  sku: string;
  title: string;
  contentLocale: CatalogLocale;
  series: CatalogSeries | null;
  creators: CatalogCreator[];
  genres: CatalogGenre[];
  price: CatalogMoney;
  compareAtPrice: CatalogMoney | null;
  stock: CatalogStock;
  coverPath: string | null;
}

export interface CatalogDetailItem extends CatalogListItem {
  description: string;
}

export interface CatalogListResponse {
  data: CatalogListItem[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
}

export interface CatalogDetailResponse {
  data: CatalogDetailItem;
}

export interface CatalogFilterOption {
  slug: string;
  name: string;
  contentLocale: CatalogLocale;
}

export interface CatalogFilterOptionsResponse {
  data: {
    genres: CatalogFilterOption[];
    series: CatalogFilterOption[];
  };
}
