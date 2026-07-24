import { z, type ZodError, type ZodType } from "zod";
import {
  invalidRequest,
  type ApiErrorDetail,
} from "../http/api-exception";

export type CatalogLocale = "en" | "ru";

export interface CatalogListQuery {
  page: number;
  pageSize: number;
  locale: CatalogLocale;
}

export interface CatalogDetailQuery {
  locale: CatalogLocale;
}

const positiveIntegerString = z
  .string()
  .regex(/^[1-9][0-9]*$/)
  .transform(Number)
  .refine(Number.isSafeInteger);

const pageSizeString = positiveIntegerString.refine(
  (value) => value <= 50,
);

const localeSchema = z.enum(["en", "ru"]);

const catalogListQuerySchema = z
  .object({
    page: positiveIntegerString.optional(),
    pageSize: pageSizeString.optional(),
    locale: localeSchema.optional(),
  })
  .strict();

const catalogDetailQuerySchema = z
  .object({
    locale: localeSchema.optional(),
  })
  .strict();

const comicSlugSchema = z
  .string()
  .max(120)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);

const fieldMessages: Record<string, string> = {
  page: "Expected a positive integer.",
  pageSize: "Expected an integer from 1 to 50.",
  locale: "Expected one of: en, ru.",
  slug: "Expected a valid comic slug.",
};

export function parseCatalogListQuery(input: unknown): CatalogListQuery {
  const parsed = parse(catalogListQuerySchema, input);

  return {
    page: parsed.page ?? 1,
    pageSize: parsed.pageSize ?? 12,
    locale: parsed.locale ?? "en",
  };
}

export function parseCatalogDetailQuery(input: unknown): CatalogDetailQuery {
  const parsed = parse(catalogDetailQuerySchema, input);

  return {
    locale: parsed.locale ?? "en",
  };
}

export function parseComicSlug(input: unknown): string {
  return parse(comicSlugSchema, input, "slug");
}

function parse<T>(
  schema: ZodType<T>,
  input: unknown,
  rootPath?: string,
): T {
  const result = schema.safeParse(input);
  if (result.success) {
    return result.data;
  }

  throw invalidRequest(toErrorDetails(result.error, rootPath));
}

function toErrorDetails(
  error: ZodError,
  rootPath?: string,
): ApiErrorDetail[] {
  const details = error.issues.flatMap((issue) => {
    if (issue.code === "unrecognized_keys") {
      return issue.keys.map((key) => ({
        path: key,
        message: "Unknown query parameter.",
      }));
    }

    const path =
      rootPath ??
      issue.path.map((segment) => String(segment)).join(".") ??
      "request";

    return [
      {
        path,
        message: fieldMessages[path] ?? "Invalid value.",
      },
    ];
  });

  return Array.from(
    new Map(
      details.map((detail) => [
        `${detail.path}\u0000${detail.message}`,
        detail,
      ]),
    ).values(),
  ).sort(
    (left, right) =>
      left.path.localeCompare(right.path) ||
      left.message.localeCompare(right.message),
  );
}
