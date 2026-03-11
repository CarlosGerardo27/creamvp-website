// @ts-nocheck
import { HttpError } from "../../_shared/errors.ts";

export type CatalogName = "all" | "categories" | "authors" | "tags";

export type CatalogsQueryInput = {
  catalog: CatalogName;
  includeInactive: boolean;
};

function parseCatalog(value: string | null): CatalogName {
  const normalized = (value ?? "all").trim().toLowerCase();
  if (normalized === "all" || normalized === "categories" || normalized === "authors" || normalized === "tags") {
    return normalized;
  }
  throw new HttpError(400, "INVALID_CATALOG", "catalog must be one of: all, categories, authors, tags.");
}

function parseBoolean(value: string | null, field: string, fallback: boolean): boolean {
  if (value === null) {
    return fallback;
  }

  const normalized = value.trim().toLowerCase();
  if (normalized === "1" || normalized === "true") {
    return true;
  }
  if (normalized === "0" || normalized === "false") {
    return false;
  }

  throw new HttpError(400, "INVALID_BOOLEAN", `${field} must be boolean (true/false).`);
}

export function validateCatalogsQuery(searchParams: URLSearchParams): CatalogsQueryInput {
  return {
    catalog: parseCatalog(searchParams.get("catalog")),
    includeInactive: parseBoolean(searchParams.get("includeInactive"), "includeInactive", false),
  };
}

