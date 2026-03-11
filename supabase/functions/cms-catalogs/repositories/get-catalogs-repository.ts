// @ts-nocheck
import type { SupabaseClient } from "npm:@supabase/supabase-js@2";
import { HttpError } from "../../_shared/errors.ts";

export type CatalogOption = {
  id: string;
  name: string;
  slug: string;
  is_active: boolean;
  updated_at: string;
};

function applyActiveFilter<T>(query: T, includeInactive: boolean): T {
  if (includeInactive) {
    return query;
  }
  return (query as any).eq("is_active", true) as T;
}

export async function listCategoryCatalog(
  userClient: SupabaseClient,
  includeInactive: boolean,
): Promise<CatalogOption[]> {
  let query = userClient
    .from("categories")
    .select("id,name,slug,is_active,updated_at")
    .order("name", { ascending: true });

  query = applyActiveFilter(query, includeInactive);
  const { data, error } = await query;
  if (error) {
    throw new HttpError(400, "CATEGORY_CATALOG_READ_FAILED", "Could not read category catalog.", error.message);
  }
  return (data ?? []) as CatalogOption[];
}

export async function listAuthorCatalog(
  userClient: SupabaseClient,
  includeInactive: boolean,
): Promise<CatalogOption[]> {
  let query = userClient
    .from("authors")
    .select("id,name,slug,is_active,updated_at")
    .order("name", { ascending: true });

  query = applyActiveFilter(query, includeInactive);
  const { data, error } = await query;
  if (error) {
    throw new HttpError(400, "AUTHOR_CATALOG_READ_FAILED", "Could not read author catalog.", error.message);
  }
  return (data ?? []) as CatalogOption[];
}

export async function listTagCatalog(
  userClient: SupabaseClient,
  includeInactive: boolean,
): Promise<CatalogOption[]> {
  let query = userClient
    .from("tags")
    .select("id,name,slug,is_active,updated_at")
    .order("name", { ascending: true });

  query = applyActiveFilter(query, includeInactive);
  const { data, error } = await query;
  if (error) {
    throw new HttpError(400, "TAG_CATALOG_READ_FAILED", "Could not read tag catalog.", error.message);
  }
  return (data ?? []) as CatalogOption[];
}

