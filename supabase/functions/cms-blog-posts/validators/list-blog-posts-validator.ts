// @ts-nocheck
import { HttpError } from "../../_shared/errors.ts";
import { expectSlug, expectStatus, expectUuid } from "../../_shared/validators.ts";
import type { BlogPostStatus } from "../../_shared/cms-blog-types.ts";

type ListStatus = BlogPostStatus | "all";
type ListSort = "updated_desc" | "publish_desc" | "publish_asc";

export type ListBlogPostsQueryInput = {
  status: ListStatus;
  categorySlug: string | null;
  authorId: string | null;
  search: string | null;
  limit: number;
  offset: number;
  sort: ListSort;
};

function parseStatus(value: string | null): ListStatus {
  if (value === null || value.trim().length === 0) {
    return "all";
  }
  if (value === "all") {
    return "all";
  }
  return expectStatus(value, "status");
}

function parseOptionalSlug(value: string | null, field: string): string | null {
  if (value === null || value.trim().length === 0) {
    return null;
  }
  return expectSlug(value, field);
}

function parseOptionalUuid(value: string | null, field: string): string | null {
  if (value === null || value.trim().length === 0) {
    return null;
  }
  return expectUuid(value, field);
}

function parseOptionalSearch(value: string | null): string | null {
  if (value === null) {
    return null;
  }
  const normalized = value.trim();
  if (!normalized) {
    return null;
  }
  if (normalized.length > 120) {
    throw new HttpError(400, "SEARCH_TOO_LONG", "search must be <= 120 characters.");
  }
  return normalized;
}

function parseBoundedInt(
  value: string | null,
  field: string,
  fallback: number,
  min: number,
  max: number,
): number {
  if (value === null || value.trim().length === 0) {
    return fallback;
  }
  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed < min || parsed > max) {
    throw new HttpError(400, "INVALID_INTEGER", `${field} must be an integer between ${min} and ${max}.`);
  }
  return parsed;
}

function parseSort(value: string | null): ListSort {
  if (value === null || value.trim().length === 0) {
    return "updated_desc";
  }

  const normalized = value.trim().toLowerCase();
  if (normalized === "updated_desc" || normalized === "publish_desc" || normalized === "publish_asc") {
    return normalized;
  }

  throw new HttpError(400, "INVALID_SORT", "sort must be one of: updated_desc, publish_desc, publish_asc.");
}

export function validateListBlogPostsQuery(searchParams: URLSearchParams): ListBlogPostsQueryInput {
  return {
    status: parseStatus(searchParams.get("status")),
    categorySlug: parseOptionalSlug(searchParams.get("categorySlug"), "categorySlug"),
    authorId: parseOptionalUuid(searchParams.get("authorId"), "authorId"),
    search: parseOptionalSearch(searchParams.get("search")),
    limit: parseBoundedInt(searchParams.get("limit"), "limit", 20, 1, 100),
    offset: parseBoundedInt(searchParams.get("offset"), "offset", 0, 0, 5000),
    sort: parseSort(searchParams.get("sort")),
  };
}

