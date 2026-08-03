import { z } from "zod";
import { catalogLocaleSchema } from "../../catalog/api/catalog.contract";

export const orderMoneySchema = z
  .object({
    amountMinor: z.number().int().nonnegative(),
    currencyCode: z.string().regex(/^[A-Z]{3}$/),
  })
  .strict();

export const checkoutAddressSchema = z
  .object({
    recipientName: z.string(),
    addressLine1: z.string(),
    addressLine2: z.string().nullable(),
    city: z.string(),
    region: z.string().nullable(),
    postalCode: z.string(),
    countryCode: z.enum(["US", "PL", "GB"]),
  })
  .strict();

export const checkoutAddressRequestSchema = z
  .object({
    recipientName: z.string().trim().min(1).max(120),
    addressLine1: z.string().trim().min(1).max(160),
    addressLine2: z.string().trim().min(1).max(160).optional(),
    city: z.string().trim().min(1).max(120),
    region: z.string().trim().min(1).max(120).optional(),
    postalCode: z.string().trim().min(1).max(32),
    countryCode: z.enum(["US", "PL", "GB"]),
  })
  .strict();

export const checkoutRequestSchema = z
  .object({
    address: checkoutAddressRequestSchema,
  })
  .strict();

export const orderStatusSchema = z.enum(["PLACED", "CANCELLED"]);

export const orderSummarySchema = z
  .object({
    orderNumber: z.string().regex(/^QCG-[0-9]{8}-[0-9]{4}$/),
    status: orderStatusSchema,
    createdAt: z.string().datetime(),
    totalItems: z.number().int().positive(),
    total: orderMoneySchema,
  })
  .strict();

export const orderLineSchema = z
  .object({
    comicSlug: z.string(),
    sku: z.string(),
    title: z.string(),
    contentLocale: catalogLocaleSchema,
    quantity: z.number().int().min(1).max(99),
    unitPrice: orderMoneySchema,
    lineTotal: orderMoneySchema,
  })
  .strict();

export const orderDetailSchema = orderSummarySchema
  .extend({
    address: checkoutAddressSchema,
    items: z.array(orderLineSchema).min(1),
  })
  .strict();

export const checkoutResponseSchema = z
  .object({
    data: z
      .object({
        order: orderDetailSchema,
      })
      .strict(),
  })
  .strict();

export const orderListResponseSchema = z
  .object({
    data: z.array(orderSummarySchema),
    pagination: z
      .object({
        page: z.number().int().positive(),
        pageSize: z.number().int().positive().max(50),
        totalItems: z.number().int().nonnegative(),
        totalPages: z.number().int().nonnegative(),
      })
      .strict(),
  })
  .strict();

export const orderDetailResponseSchema = z
  .object({
    data: z
      .object({
        order: orderDetailSchema,
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

export type CheckoutAddressRequest = z.infer<
  typeof checkoutAddressRequestSchema
>;
export type CheckoutRequest = z.infer<typeof checkoutRequestSchema>;
export type CheckoutResponse = z.infer<typeof checkoutResponseSchema>;
export type OrderSummary = z.infer<typeof orderSummarySchema>;
export type OrderDetail = z.infer<typeof orderDetailSchema>;
export type OrderListResponse = z.infer<typeof orderListResponseSchema>;
export type OrderDetailResponse = z.infer<typeof orderDetailResponseSchema>;
export type ApiErrorDetail = z.infer<typeof apiErrorDetailSchema>;
