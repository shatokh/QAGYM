import type { CatalogLocale } from "../catalog/catalog.schemas";
import type { OrderStatus } from "../generated/prisma/enums";

export interface CheckoutAddressDto {
  recipientName: string;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  region: string | null;
  postalCode: string;
  countryCode: string;
}

export interface OrderMoney {
  amountMinor: number;
  currencyCode: string;
}

export interface OrderLineDto {
  comicSlug: string;
  sku: string;
  title: string;
  contentLocale: CatalogLocale;
  quantity: number;
  unitPrice: OrderMoney;
  lineTotal: OrderMoney;
}

export interface OrderSummaryDto {
  orderNumber: string;
  status: OrderStatus;
  createdAt: string;
  totalItems: number;
  total: OrderMoney;
}

export interface OrderDetailDto extends OrderSummaryDto {
  address: CheckoutAddressDto;
  items: OrderLineDto[];
}

export interface CheckoutResponse {
  data: {
    order: OrderDetailDto;
  };
}

export interface OrderListResponse {
  data: OrderSummaryDto[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
}

export interface OrderDetailResponse {
  data: {
    order: OrderDetailDto;
  };
}
