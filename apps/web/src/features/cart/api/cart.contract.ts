import { z } from "zod";
import { catalogLocaleSchema } from "../../catalog/api/catalog.contract";

export const cartMoneySchema = z
  .object({
    amountMinor: z.number().int().nonnegative(),
    currencyCode: z.string().regex(/^[A-Z]{3}$/),
  })
  .strict();

const cartStockSchema = z
  .object({
    quantity: z.number().int().nonnegative(),
    inStock: z.boolean(),
  })
  .strict()
  .refine((stock) => stock.inStock === (stock.quantity > 0), {
    message: "Stock availability does not match quantity.",
  });

export const cartItemSchema = z
  .object({
    comicSlug: z.string(),
    sku: z.string(),
    title: z.string(),
    contentLocale: catalogLocaleSchema,
    quantity: z.number().int().min(1).max(99),
    unitPrice: cartMoneySchema,
    lineTotal: cartMoneySchema,
    stock: cartStockSchema,
    coverPath: z.string().nullable(),
  })
  .strict();

export const cartSchema = z
  .object({
    items: z.array(cartItemSchema),
    totalItems: z.number().int().nonnegative(),
    subtotal: cartMoneySchema,
  })
  .strict();

export const cartResponseSchema = z
  .object({
    data: z
      .object({
        cart: cartSchema,
      })
      .strict(),
  })
  .strict();

export const csrfTokenResponseSchema = z
  .object({
    data: z
      .object({
        csrfToken: z.string().min(20),
      })
      .strict(),
  })
  .strict();

export const apiErrorDetailSchema = z
  .object({
    path: z.string(),
    message: z.string(),
  })
  .strict();

export const apiErrorEnvelopeSchema = z
  .object({
    error: z
      .object({
        code: z.string(),
        message: z.string(),
        details: z.array(apiErrorDetailSchema),
      })
      .strict(),
  })
  .strict();

export type Cart = z.infer<typeof cartSchema>;
export type CartItem = z.infer<typeof cartItemSchema>;
export type CartResponse = z.infer<typeof cartResponseSchema>;
export type CsrfTokenResponse = z.infer<typeof csrfTokenResponseSchema>;
export type ApiErrorDetail = z.infer<typeof apiErrorDetailSchema>;
