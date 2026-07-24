import { z } from "zod";

export const catalogLocaleSchema = z.enum(["en", "ru"]);

const moneySchema = z
  .object({
    amountMinor: z.number().int().nonnegative(),
    currencyCode: z.string().regex(/^[A-Z]{3}$/),
  })
  .strict();

const stockSchema = z
  .object({
    quantity: z.number().int().nonnegative(),
    inStock: z.boolean(),
  })
  .strict()
  .refine((stock) => stock.inStock === (stock.quantity > 0), {
    message: "Stock availability does not match quantity.",
  });

const seriesSchema = z
  .object({
    slug: z.string(),
    title: z.string(),
    contentLocale: catalogLocaleSchema,
    issueNumber: z.number().int().positive(),
  })
  .strict();

const creatorSchema = z
  .object({
    slug: z.string(),
    displayName: z.string(),
    role: z.enum(["WRITER", "ARTIST"]),
  })
  .strict();

const genreSchema = z
  .object({
    slug: z.string(),
    name: z.string(),
    contentLocale: catalogLocaleSchema,
  })
  .strict();

export const catalogListItemSchema = z
  .object({
    slug: z.string(),
    sku: z.string(),
    title: z.string(),
    contentLocale: catalogLocaleSchema,
    series: seriesSchema.nullable(),
    creators: z.array(creatorSchema),
    genres: z.array(genreSchema),
    price: moneySchema,
    compareAtPrice: moneySchema.nullable(),
    stock: stockSchema,
    coverPath: z.string().nullable(),
  })
  .strict();

export const catalogDetailItemSchema = catalogListItemSchema.extend({
  description: z.string(),
});

export const catalogListResponseSchema = z
  .object({
    data: z.array(catalogListItemSchema),
    pagination: z
      .object({
        page: z.number().int().positive(),
        pageSize: z.number().int().min(1).max(50),
        totalItems: z.number().int().nonnegative(),
        totalPages: z.number().int().nonnegative(),
      })
      .strict(),
  })
  .strict();

export const catalogDetailResponseSchema = z
  .object({
    data: catalogDetailItemSchema,
  })
  .strict();

export const apiErrorEnvelopeSchema = z
  .object({
    error: z
      .object({
        code: z.string(),
        message: z.string(),
        details: z.array(
          z
            .object({
              path: z.string(),
              message: z.string(),
            })
            .strict(),
        ),
      })
      .strict(),
  })
  .strict();

export type CatalogLocale = z.infer<typeof catalogLocaleSchema>;
export type CatalogListItem = z.infer<typeof catalogListItemSchema>;
export type CatalogDetailItem = z.infer<typeof catalogDetailItemSchema>;
export type CatalogListResponse = z.infer<typeof catalogListResponseSchema>;
export type CatalogDetailResponse = z.infer<typeof catalogDetailResponseSchema>;
export type ApiErrorEnvelope = z.infer<typeof apiErrorEnvelopeSchema>;
