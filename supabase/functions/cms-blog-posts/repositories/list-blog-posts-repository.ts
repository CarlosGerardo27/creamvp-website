// @ts-nocheck
import type { SupabaseClient } from "npm:@supabase/supabase-js@2";
import { HttpError } from "../../_shared/errors.ts";
import type { ListBlogPostsQueryInput } from "../validators/list-blog-posts-validator.ts";

type BlogPostListRow = {
  id: string;
  status: "draft" | "scheduled" | "published";
  slug: string;
  category_id: string;
  category_slug: string;
  h1: string | null;
  meta_description: string | null;
  short_description: string | null;
  publish_date: string | null;
  scheduled_publish_at: string | null;
  author_id: string | null;
  created_at: string;
  updated_at: string;
};

type TaxonomyRef = {
  id: string;
  name: string;
  slug: string;
  is_active: boolean;
};

export type BlogPostListItem = BlogPostListRow & {
  route_path: string;
  category: TaxonomyRef | null;
  author: TaxonomyRef | null;
};

export type BlogPostListResponse = {
  items: BlogPostListItem[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
};

function sortRows(rows: BlogPostListRow[], sort: ListBlogPostsQueryInput["sort"]): BlogPostListRow[] {
  if (sort === "updated_desc") {
    return rows.slice().sort((a, b) => Date.parse(b.updated_at) - Date.parse(a.updated_at));
  }
  if (sort === "publish_asc") {
    return rows.slice().sort((a, b) => Date.parse(a.publish_date ?? "") - Date.parse(b.publish_date ?? ""));
  }
  return rows.slice().sort((a, b) => Date.parse(b.publish_date ?? "") - Date.parse(a.publish_date ?? ""));
}

function applySearch(rows: BlogPostListRow[], search: string | null): BlogPostListRow[] {
  if (!search) {
    return rows;
  }

  const term = search.toLowerCase();
  return rows.filter((row) => {
    const haystack = [
      row.slug,
      row.category_slug,
      row.h1 ?? "",
      row.meta_description ?? "",
      row.short_description ?? "",
    ]
      .join(" ")
      .toLowerCase();
    return haystack.includes(term);
  });
}

function indexById(rows: TaxonomyRef[]): Map<string, TaxonomyRef> {
  const map = new Map<string, TaxonomyRef>();
  for (const row of rows) {
    map.set(row.id, row);
  }
  return map;
}

export async function readBlogPostsList(
  userClient: SupabaseClient,
  input: ListBlogPostsQueryInput,
): Promise<BlogPostListResponse> {
  let query = userClient
    .from("blog_posts")
    .select(
      "id,status,slug,category_id,category_slug,h1,meta_description,short_description,publish_date,scheduled_publish_at,author_id,created_at,updated_at",
    );

  if (input.status !== "all") {
    query = query.eq("status", input.status);
  }

  if (input.categorySlug) {
    query = query.eq("category_slug", input.categorySlug);
  }

  if (input.authorId) {
    query = query.eq("author_id", input.authorId);
  }

  const { data, error } = await query;
  if (error) {
    throw new HttpError(400, "BLOG_POST_LIST_READ_FAILED", "Could not read blog posts list.", error.message);
  }

  const rawRows = (data ?? []) as BlogPostListRow[];
  const searchedRows = applySearch(rawRows, input.search);
  const sortedRows = sortRows(searchedRows, input.sort);

  const total = sortedRows.length;
  const pagedRows = sortedRows.slice(input.offset, input.offset + input.limit);

  const [categoriesRes, authorsRes] = await Promise.all([
    userClient.from("categories").select("id,name,slug,is_active"),
    userClient.from("authors").select("id,name,slug,is_active"),
  ]);

  if (categoriesRes.error) {
    throw new HttpError(400, "CATEGORY_CATALOG_READ_FAILED", "Could not resolve categories for posts.", categoriesRes.error.message);
  }
  if (authorsRes.error) {
    throw new HttpError(400, "AUTHOR_CATALOG_READ_FAILED", "Could not resolve authors for posts.", authorsRes.error.message);
  }

  const categoryById = indexById((categoriesRes.data ?? []) as TaxonomyRef[]);
  const authorById = indexById((authorsRes.data ?? []) as TaxonomyRef[]);

  const items: BlogPostListItem[] = pagedRows.map((row) => ({
    ...row,
    route_path: `/blog/${row.category_slug}/${row.slug}`,
    category: categoryById.get(row.category_id) ?? null,
    author: row.author_id ? authorById.get(row.author_id) ?? null : null,
  }));

  return {
    items,
    pagination: {
      total,
      limit: input.limit,
      offset: input.offset,
      hasMore: input.offset + input.limit < total,
    },
  };
}

