// @ts-nocheck
import type { SupabaseClient } from "npm:@supabase/supabase-js@2";
import { HttpError } from "../../_shared/errors.ts";

type BlogPostCore = {
  id: string;
  status: "draft" | "scheduled" | "published";
  slug: string;
  category_id: string;
  category_slug: string;
  h1: string | null;
  meta_description: string | null;
  canonical_url: string | null;
  short_description: string | null;
  featured_image_url: string | null;
  featured_image_alt: string | null;
  featured_image_metadata: Record<string, unknown>;
  author_id: string | null;
  content_markdown: string | null;
  schema_auto: Record<string, unknown> | null;
  schema_override: Record<string, unknown> | null;
  seo: Record<string, unknown>;
  publish_date: string | null;
  scheduled_publish_at: string | null;
  created_at: string;
  updated_at: string;
  updated_date: string | null;
};

type CategoryRef = {
  id: string;
  name: string;
  slug: string;
  is_active: boolean;
};

type AuthorRef = {
  id: string;
  name: string;
  slug: string;
  photo_url: string | null;
  is_active: boolean;
};

export type BlogPostDetails = BlogPostCore & {
  tags: string[];
  faqs: Array<{
    question: string;
    answer: string;
    position: number;
  }>;
  category: CategoryRef | null;
  author: AuthorRef | null;
};

const BLOG_POST_SELECT =
  "id,status,slug,category_id,category_slug,h1,meta_description,canonical_url,short_description,featured_image_url,featured_image_alt,featured_image_metadata,author_id,content_markdown,schema_auto,schema_override,seo,publish_date,scheduled_publish_at,created_at,updated_at,updated_date";

async function hydrateBlogPostDetails(
  userClient: SupabaseClient,
  corePost: BlogPostCore,
): Promise<BlogPostDetails> {
  const tagPromise = userClient.from("blog_post_tags").select("tag_id").eq("blog_post_id", corePost.id);
  const faqPromise = userClient
    .from("blog_faqs")
    .select("question,answer,position")
    .eq("blog_post_id", corePost.id)
    .order("position", { ascending: true });
  const categoryPromise = userClient
    .from("categories")
    .select("id,name,slug,is_active")
    .eq("id", corePost.category_id)
    .maybeSingle();

  const authorPromise = corePost.author_id
    ? userClient
        .from("authors")
        .select("id,name,slug,photo_url,is_active")
        .eq("id", corePost.author_id)
        .maybeSingle()
    : Promise.resolve({ data: null, error: null });

  const [tagRes, faqRes, categoryRes, authorRes] = await Promise.all([
    tagPromise,
    faqPromise,
    categoryPromise,
    authorPromise,
  ]);

  if (tagRes.error) {
    throw new HttpError(400, "BLOG_POST_TAGS_READ_FAILED", "Could not read blog post tags.", tagRes.error.message);
  }
  if (faqRes.error) {
    throw new HttpError(400, "BLOG_POST_FAQS_READ_FAILED", "Could not read blog FAQs.", faqRes.error.message);
  }
  if (categoryRes.error) {
    throw new HttpError(
      400,
      "BLOG_POST_CATEGORY_READ_FAILED",
      "Could not read blog category reference.",
      categoryRes.error.message,
    );
  }
  if (authorRes.error) {
    throw new HttpError(
      400,
      "BLOG_POST_AUTHOR_READ_FAILED",
      "Could not read blog author reference.",
      authorRes.error.message,
    );
  }

  return {
    ...corePost,
    tags: (tagRes.data ?? []).map((row) => String(row.tag_id)),
    faqs: (faqRes.data ?? []).map((row) => ({
      question: String(row.question ?? ""),
      answer: String(row.answer ?? ""),
      position: Number(row.position ?? 0),
    })),
    category: (categoryRes.data as CategoryRef | null) ?? null,
    author: (authorRes.data as AuthorRef | null) ?? null,
  };
}

export async function getBlogPostDetailsById(
  userClient: SupabaseClient,
  postId: string,
): Promise<BlogPostDetails | null> {
  const { data, error } = await userClient
    .from("blog_posts")
    .select(BLOG_POST_SELECT)
    .eq("id", postId)
    .maybeSingle();

  if (error) {
    throw new HttpError(400, "BLOG_POST_READ_FAILED", "Could not read blog post by id.", error.message);
  }
  if (!data) {
    return null;
  }

  return hydrateBlogPostDetails(userClient, data as BlogPostCore);
}

export async function getBlogPostDetailsByRoute(
  userClient: SupabaseClient,
  categorySlug: string,
  slug: string,
): Promise<BlogPostDetails | null> {
  const { data, error } = await userClient
    .from("blog_posts")
    .select(BLOG_POST_SELECT)
    .eq("category_slug", categorySlug)
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    throw new HttpError(400, "BLOG_POST_READ_FAILED", "Could not read blog post by route.", error.message);
  }
  if (!data) {
    return null;
  }

  return hydrateBlogPostDetails(userClient, data as BlogPostCore);
}

