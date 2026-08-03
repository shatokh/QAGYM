import { z, type ZodError, type ZodType } from "zod";
import type { CatalogLocale } from "../catalog/catalog.schemas";
import {
  invalidRequest,
  type ApiErrorDetail,
} from "../http/api-exception";

export interface CartQuery {
  locale: CatalogLocale;
}

export interface AddCartLineBody {
  comicSlug: string;
  quantity: number;
}

export interface UpdateCartLineBody {
  quantity: number;
}

const localeSchema = z.enum(["en", "ru"]);

const cartQuerySchema = z
  .object({
    locale: localeSchema.optional(),
  })
  .strict();

const emptyQuerySchema = z.object({}).strict();

const comicSlugSchema = z
  .string()
  .max(120)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);

const quantitySchema = z
  .number()
  .int()
  .min(1)
  .max(99);

const addCartLineBodySchema = z
  .object({
    comicSlug: comicSlugSchema,
    quantity: quantitySchema,
  })
  .strict();

const updateCartLineBodySchema = z
  .object({
    quantity: quantitySchema,
  })
  .strict();

const fieldMessages: Record<string, string> = {
  comicSlug: "Expected a valid comic slug.",
  quantity: "Expected an integer from 1 to 99.",
  locale: "Expected one of: en, ru.",
  slug: "Expected a valid comic slug.",
};

export function parseCartQuery(input: unknown): CartQuery {
  const parsed = parse(cartQuerySchema, input);

  return {
    locale: parsed.locale ?? "en",
  };
}

export function parseEmptyCartQuery(input: unknown): void {
  parse(emptyQuerySchema, input);
}

export function parseAddCartLineBody(input: unknown): AddCartLineBody {
  return parseJsonBody(addCartLineBodySchema, input ?? {});
}

export function parseUpdateCartLineBody(
  input: unknown,
): UpdateCartLineBody {
  return parseJsonBody(updateCartLineBodySchema, input ?? {});
}

export function parseCartComicSlug(input: unknown): string {
  return parse(comicSlugSchema, input, "slug");
}

function parseJsonBody<T>(schema: ZodType<T>, input: unknown): T {
  if (!isPlainObject(input)) {
    throw invalidRequest([
      {
        path: "body",
        message: "Expected a JSON object.",
      },
    ]);
  }

  return parse(schema, input, undefined, "body");
}

function parse<T>(
  schema: ZodType<T>,
  input: unknown,
  rootPath?: string,
  source: "query" | "body" = "query",
): T {
  const result = schema.safeParse(input);
  if (result.success) {
    return result.data;
  }

  throw invalidRequest(toErrorDetails(result.error, rootPath, source));
}

function isPlainObject(input: unknown): input is Record<string, unknown> {
  return (
    typeof input === "object" &&
    input !== null &&
    !Array.isArray(input)
  );
}

function toErrorDetails(
  error: ZodError,
  rootPath: string | undefined,
  source: "query" | "body",
): ApiErrorDetail[] {
  const details = error.issues.flatMap((issue) => {
    if (issue.code === "unrecognized_keys") {
      const message =
        source === "query"
          ? "Unknown query parameter."
          : "Unknown body field.";

      return issue.keys.map((key) => ({
        path: key,
        message,
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
