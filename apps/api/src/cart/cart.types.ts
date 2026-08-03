import type { CatalogLocale } from "../catalog/catalog.schemas";

export interface CartMoney {
  amountMinor: number;
  currencyCode: string;
}

export interface CartStock {
  quantity: number;
  inStock: boolean;
}

export interface CartItem {
  comicSlug: string;
  sku: string;
  title: string;
  contentLocale: CatalogLocale;
  quantity: number;
  unitPrice: CartMoney;
  lineTotal: CartMoney;
  stock: CartStock;
  coverPath: string | null;
}

export interface CartDto {
  items: CartItem[];
  totalItems: number;
  subtotal: CartMoney;
}

export interface CartResponse {
  data: {
    cart: CartDto;
  };
}

export interface CsrfTokenResponse {
  data: {
    csrfToken: string;
  };
}
