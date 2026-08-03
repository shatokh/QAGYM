import { z, type ZodError, type ZodType } from "zod";
import type { CatalogLocale } from "../catalog/catalog.schemas";
import {
  invalidRequest,
  type ApiErrorDetail,
} from "../http/api-exception";

export interface CheckoutQuery {
  locale: CatalogLocale;
}

export interface OrderListQuery {
  page: number;
  pageSize: number;
}

export interface CheckoutAddressBody {
  recipientName: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  region?: string;
  postalCode: string;
  countryCode: "US" | "PL" | "GB";
}

export interface CheckoutBody {
  address: CheckoutAddressBody;
}

const positiveIntegerString = z
  .string()
  .regex(/^[1-9][0-9]*$/)
  .transform(Number)
  .refine(Number.isSafeInteger);

const pageSizeString = positiveIntegerString.refine(
  (value) => value <= 50,
);

const nonEmptyString = (maxLength: number) =>
  z.string().trim().min(1).max(maxLength);

const localeSchema = z.enum(["en", "ru"]);
const countryCodeSchema = z.enum(["US", "PL", "GB"]);

const checkoutQuerySchema = z
  .object({
    locale: localeSchema.optional(),
  })
  .strict();

const orderListQuerySchema = z
  .object({
    page: positiveIntegerString.optional(),
    pageSize: pageSizeString.optional(),
  })
  .strict();

const checkoutBodySchema = z
  .object({
    address: z
      .object({
        recipientName: nonEmptyString(120),
        addressLine1: nonEmptyString(160),
        addressLine2: nonEmptyString(160).optional(),
        city: nonEmptyString(120),
        region: nonEmptyString(120).optional(),
        postalCode: nonEmptyString(32),
        countryCode: countryCodeSchema,
      })
      .strict(),
  })
  .strict();

const orderNumberSchema = z
  .string()
  .regex(/^QCG-[0-9]{8}-[0-9]{4}$/);

const fieldMessages: Record<string, string> = {
  locale: "Expected one of: en, ru.",
  page: "Expected a positive integer.",
  pageSize: "Expected an integer from 1 to 50.",
  orderNumber: "Expected a valid order number.",
  address: "Expected a checkout address object.",
  "address.recipientName": "Expected a string from 1 to 120 characters.",
  "address.addressLine1": "Expected a string from 1 to 160 characters.",
  "address.addressLine2": "Expected a string from 1 to 160 characters.",
  "address.city": "Expected a string from 1 to 120 characters.",
  "address.region": "Expected a string from 1 to 120 characters.",
  "address.postalCode": "Expected a string from 1 to 32 characters.",
  "address.countryCode": "Expected one of: US, PL, GB.",
};

export function parseCheckoutQuery(input: unknown): CheckoutQuery {
  const parsed = parse(checkoutQuerySchema, input);

  return {
    locale: parsed.locale ?? "en",
  };
}

export function parseOrderListQuery(input: unknown): OrderListQuery {
  const parsed = parse(orderListQuerySchema, input);

  return {
    page: parsed.page ?? 1,
    pageSize: parsed.pageSize ?? 12,
  };
}

export function parseCheckoutBody(input: unknown): CheckoutBody {
  return parseJsonBody(checkoutBodySchema, input ?? {});
}

export function parseOrderNumber(input: unknown): string {
  return parse(orderNumberSchema, input, "orderNumber");
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
      const parentPath = issue.path
        .map((segment) => String(segment))
        .join(".");

      return issue.keys.map((key) => ({
        path: parentPath ? `${parentPath}.${key}` : key,
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
