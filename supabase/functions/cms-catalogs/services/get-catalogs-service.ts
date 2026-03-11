// @ts-nocheck
import type { AuthContext } from "../../_shared/auth.ts";
import { enforceRateLimit } from "../../_shared/rate-limit.ts";
import {
  listAuthorCatalog,
  listCategoryCatalog,
  listTagCatalog,
  type CatalogOption,
} from "../repositories/get-catalogs-repository.ts";
import type { CatalogsQueryInput } from "../validators/get-catalogs-validator.ts";

export type CatalogsResponse = {
  categories: CatalogOption[];
  authors: CatalogOption[];
  tags: CatalogOption[];
};

export async function getCatalogs(context: AuthContext, input: CatalogsQueryInput): Promise<CatalogsResponse> {
  await enforceRateLimit(context.serviceClient, {
    endpoint: "cms-catalogs",
    userId: context.user.id,
    maxRequests: 120,
    windowSeconds: 60,
  });

  const categories =
    input.catalog === "all" || input.catalog === "categories"
      ? await listCategoryCatalog(context.userClient, input.includeInactive)
      : [];
  const authors =
    input.catalog === "all" || input.catalog === "authors"
      ? await listAuthorCatalog(context.userClient, input.includeInactive)
      : [];
  const tags =
    input.catalog === "all" || input.catalog === "tags"
      ? await listTagCatalog(context.userClient, input.includeInactive)
      : [];

  return { categories, authors, tags };
}

