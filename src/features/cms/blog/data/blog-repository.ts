import { invokeCmsFunction } from "@/features/cms/shared/function-client";
import { getCmsRequestContext } from "@/features/cms/shared/request-context";
import type {
  CmsBlogListFilters,
  CmsBlogListItem,
  CmsBlogPostDetails,
  CmsCreateBlogInput,
  CmsOption,
  CmsUpdateBlogInput,
  CmsUpdateBlogStatusInput,
} from "../domain/types";

type CmsFunctionEnvelope<T> = {
  data: T;
  meta: {
    requestId: string;
    endpoint: string;
  };
};

type BlogPostSummary = {
  id: string;
  status: "draft" | "scheduled" | "published";
  slug: string;
  category_slug: string;
  publish_date: string | null;
  scheduled_publish_at?: string | null;
  updated_at: string;
};

type PreviewTokenEnvelope = {
  data: {
    postId: string;
    status: "draft" | "scheduled" | "published";
    previewUrl: string;
    token: string;
    expiresAt: string;
  };
  meta: {
    generatedBy: string;
    generatedRole: string;
  };
};

function parseSearchForIlike(search: string): string {
  return search.replace(/[%_,]/g, "").trim();
}

export async function listBlogPosts(filters: CmsBlogListFilters = {}): Promise<CmsBlogListItem[]> {
  const context = await getCmsRequestContext();
  let query = context.supabase
    .from("blog_posts")
    .select("id,status,slug,category_slug,h1,meta_description,publish_date,updated_at")
    .order("updated_at", { ascending: false })
    .limit(100);

  if (filters.status && filters.status !== "all") {
    query = query.eq("status", filters.status);
  }

  if (filters.search?.trim()) {
    const search = parseSearchForIlike(filters.search);
    if (search) {
      query = query.or(`slug.ilike.%${search}%,h1.ilike.%${search}%`);
    }
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(`No se pudo cargar listado de posts: ${error.message}`);
  }

  return (data ?? []) as CmsBlogListItem[];
}

export async function getBlogPostById(postId: string): Promise<CmsBlogPostDetails | null> {
  const context = await getCmsRequestContext();
  const { data, error } = await context.supabase
    .from("blog_posts")
    .select(
      "id,status,slug,category_id,category_slug,h1,meta_description,canonical_url,short_description,featured_image_url,featured_image_alt,featured_image_metadata,author_id,content_markdown,schema_auto,schema_override,seo,publish_date,scheduled_publish_at,updated_at",
    )
    .eq("id", postId)
    .maybeSingle();

  if (error) {
    throw new Error(`No se pudo cargar el post: ${error.message}`);
  }

  if (!data) {
    return null;
  }

  const [tagsRes, faqsRes] = await Promise.all([
    context.supabase.from("blog_post_tags").select("tag_id").eq("blog_post_id", postId),
    context.supabase
      .from("blog_faqs")
      .select("question,answer,position")
      .eq("blog_post_id", postId)
      .order("position", { ascending: true }),
  ]);

  if (tagsRes.error) {
    throw new Error(`No se pudieron cargar tags del post: ${tagsRes.error.message}`);
  }
  if (faqsRes.error) {
    throw new Error(`No se pudieron cargar FAQs del post: ${faqsRes.error.message}`);
  }

  const tags = (tagsRes.data ?? []).map((item) => String(item.tag_id));
  const faqs = (faqsRes.data ?? []).map((item) => ({
    question: String(item.question ?? ""),
    answer: String(item.answer ?? ""),
    position: Number(item.position ?? 0),
  }));

  return {
    ...(data as Omit<CmsBlogPostDetails, "tags" | "faqs">),
    tags,
    faqs,
  };
}

export async function listCategoryOptions(): Promise<CmsOption[]> {
  const context = await getCmsRequestContext();
  const { data, error } = await context.supabase
    .from("categories")
    .select("id,name,slug")
    .eq("is_active", true)
    .order("name", { ascending: true });

  if (error) {
    throw new Error(`No se pudieron cargar categorias: ${error.message}`);
  }

  return (data ?? []).map((item) => ({
    id: String(item.id),
    name: String(item.name),
    slug: String(item.slug),
  }));
}

export async function listAuthorOptions(): Promise<CmsOption[]> {
  const context = await getCmsRequestContext();
  const { data, error } = await context.supabase
    .from("authors")
    .select("id,name,slug")
    .eq("is_active", true)
    .order("name", { ascending: true });

  if (error) {
    throw new Error(`No se pudieron cargar autores: ${error.message}`);
  }

  return (data ?? []).map((item) => ({
    id: String(item.id),
    name: String(item.name),
    slug: String(item.slug),
  }));
}

export async function listTagOptions(): Promise<CmsOption[]> {
  const context = await getCmsRequestContext();
  const { data, error } = await context.supabase
    .from("tags")
    .select("id,name,slug")
    .eq("is_active", true)
    .order("name", { ascending: true });

  if (error) {
    throw new Error(`No se pudieron cargar tags: ${error.message}`);
  }

  return (data ?? []).map((item) => ({
    id: String(item.id),
    name: String(item.name),
    slug: String(item.slug),
  }));
}

export async function createBlogDraft(input: CmsCreateBlogInput): Promise<BlogPostSummary> {
  const response = await invokeCmsFunction<CmsFunctionEnvelope<BlogPostSummary>>(
    "cms-blog-create",
    "POST",
    input,
  );
  return response.data;
}

export async function updateBlogPost(input: CmsUpdateBlogInput): Promise<BlogPostSummary> {
  const response = await invokeCmsFunction<CmsFunctionEnvelope<BlogPostSummary>>(
    "cms-blog-update",
    "PATCH",
    input,
  );
  return response.data;
}

export async function updateBlogPostStatus(input: CmsUpdateBlogStatusInput): Promise<BlogPostSummary> {
  const response = await invokeCmsFunction<CmsFunctionEnvelope<BlogPostSummary>>(
    "cms-blog-status",
    "PATCH",
    input,
  );
  return response.data;
}

export async function deleteBlogPost(postId: string, changeReason?: string | null): Promise<BlogPostSummary> {
  const response = await invokeCmsFunction<CmsFunctionEnvelope<BlogPostSummary>>(
    "cms-blog-delete",
    "DELETE",
    {
      postId,
      changeReason: changeReason ?? null,
    },
  );
  return response.data;
}

export async function createBlogPreviewToken(postId: string): Promise<PreviewTokenEnvelope["data"]> {
  const context = await getCmsRequestContext();
  const response = await fetch("/api/cms/preview-token", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${context.accessToken}`,
      apikey: context.anonKey,
    },
    body: JSON.stringify({ postId }),
  });

  let parsed: unknown = null;
  try {
    parsed = await response.json();
  } catch {
    parsed = null;
  }

  if (!response.ok) {
    const errorMessage =
      parsed &&
      typeof parsed === "object" &&
      "error" in parsed &&
      parsed.error &&
      typeof parsed.error === "object" &&
      "message" in parsed.error &&
      typeof parsed.error.message === "string"
        ? parsed.error.message
        : "No se pudo generar token de preview.";
    throw new Error(errorMessage);
  }

  const envelope = parsed as PreviewTokenEnvelope;
  return envelope.data;
}

export function buildCanonicalUrl(categorySlug: string | null | undefined, slug: string): string {
  if (!categorySlug) {
    return "";
  }
  return `https://creamvp.com/blog/${categorySlug}/${slug}`;
}
