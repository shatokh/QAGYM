import { z, type ZodError, type ZodType } from "zod";
import {
  invalidRequest,
  type ApiErrorDetail,
} from "../http/api-exception";

export interface LoginBody {
  email: string;
  password: string;
}

type HeaderValue = string | string[] | undefined;

export type HeaderBag = Record<string, HeaderValue>;

const loginBodySchema = z
  .object({
    email: z.string().trim().toLowerCase().max(254).email(),
    password: z.string().min(1).max(200),
  })
  .strict();

const logoutBodySchema = z.object({}).strict();

export function parseLoginBody(input: unknown): LoginBody {
  return parse(loginBodySchema, input ?? {});
}

export function parseLogoutBody(input: unknown): Record<string, never> {
  return parse(logoutBodySchema, input ?? {});
}

export function assertJsonRequest(
  headers: HeaderBag,
  options: { allowEmptyWithoutContentType?: boolean } = {},
): void {
  const contentType = firstHeader(headers["content-type"]);
  const contentLength = firstHeader(headers["content-length"]);

  if (!contentType) {
    if (
      options.allowEmptyWithoutContentType &&
      (!contentLength || contentLength === "0")
    ) {
      return;
    }

    throw invalidRequest([
      {
        path: "contentType",
        message: "Expected application/json.",
      },
    ]);
  }

  if (!/^application\/json(?:\s*;|$)/i.test(contentType)) {
    throw invalidRequest([
      {
        path: "contentType",
        message: "Expected application/json.",
      },
    ]);
  }
}

function parse<T>(schema: ZodType<T>, input: unknown): T {
  if (!isPlainObject(input)) {
    throw invalidRequest([
      {
        path: "body",
        message: "Expected a JSON object.",
      },
    ]);
  }

  const result = schema.safeParse(input);
  if (result.success) {
    return result.data;
  }

  throw invalidRequest(toErrorDetails(result.error));
}

function isPlainObject(input: unknown): input is Record<string, unknown> {
  return (
    typeof input === "object" &&
    input !== null &&
    !Array.isArray(input)
  );
}

function firstHeader(value: HeaderValue): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function toErrorDetails(error: ZodError): ApiErrorDetail[] {
  const details = error.issues.flatMap((issue) => {
    if (issue.code === "unrecognized_keys") {
      return issue.keys.map((key) => ({
        path: key,
        message: "Unknown body field.",
      }));
    }

    const path = issue.path.map((segment) => String(segment)).join(".");

    return [
      {
        path: path || "body",
        message: fieldMessage(path, issue.code),
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

function fieldMessage(path: string, issueCode: string): string {
  if (path === "email" && issueCode === "too_big") {
    return "Expected at most 254 characters.";
  }

  if (path === "email") {
    return "Expected a valid email address.";
  }

  if (path === "password" && issueCode === "too_big") {
    return "Expected at most 200 characters.";
  }

  if (path === "password") {
    return "Expected a non-empty string.";
  }

  return "Invalid value.";
}
