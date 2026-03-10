// @ts-nocheck
import { HttpError } from "./errors.ts";
import { BLOG_POST_STATUSES, type BlogPostStatus } from "./cms-blog-types.ts";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function expectRecord(value: unknown, code = "INVALID_BODY", message = "Payload must be an object."): Record<string, unknown> {
  if (!isRecord(value)) {
    throw new HttpError(400, code, message);
  }
  return value;
}

export function expectUuid(value: unknown, field: string): string {
  if (typeof value !== "string" || !UUID_REGEX.test(value.trim())) {
    throw new HttpError(400, "INVALID_UUID", `Field '${field}' must be a valid UUID.`);
  }
  return value.trim();
}

export function expectSlug(value: unknown, field: string): string {
  if (typeof value !== "string" || !SLUG_REGEX.test(value.trim())) {
    throw new HttpError(400, "INVALID_SLUG", `Field '${field}' must use slug format a-z0-9-`);
  }
  return value.trim();
}

export function expectString(value: unknown, field: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new HttpError(400, "INVALID_STRING", `Field '${field}' must be a non-empty string.`);
  }
  return value.trim();
}

export function optionalString(value: unknown, field: string): string | null | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (value === null) {
    return null;
  }
  if (typeof value !== "string") {
    throw new HttpError(400, "INVALID_STRING", `Field '${field}' must be a string.`);
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function optionalJsonObject(value: unknown, field: string): Record<string, unknown> | null | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (value === null) {
    return null;
  }
  if (!isRecord(value)) {
    throw new HttpError(400, "INVALID_JSON_OBJECT", `Field '${field}' must be a JSON object.`);
  }
  return value;
}

export function optionalStringArray(value: unknown, field: string): string[] | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (!Array.isArray(value)) {
    throw new HttpError(400, "INVALID_ARRAY", `Field '${field}' must be an array.`);
  }

  return value.map((item, index) => expectString(item, `${field}[${index}]`));
}

export function expectStatus(value: unknown, field: string): BlogPostStatus {
  if (typeof value !== "string" || !BLOG_POST_STATUSES.includes(value as BlogPostStatus)) {
    throw new HttpError(
      400,
      "INVALID_STATUS",
      `Field '${field}' must be one of: ${BLOG_POST_STATUSES.join(", ")}.`,
    );
  }
  return value as BlogPostStatus;
}

