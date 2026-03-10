// @ts-nocheck
import type { SupabaseClient } from "npm:@supabase/supabase-js@2";
import { HttpError } from "../../_shared/errors.ts";
import type { BlogFaqPayload } from "../../_shared/cms-blog-types.ts";
import type { CreateBlogPostInput } from "../validators/create-blog-validator.ts";

export type BlogPostSummary = {
  id: string;
  status: string;
  slug: string;
  category_slug: string;
  publish_date: string | null;
  updated_at: string;
};

export async function insertDraftBlogPost(
  userClient: SupabaseClient,
  input: CreateBlogPostInput,
  userId: string,
): Promise<string> {
  const { data, error } = await userClient
    .from("blog_posts")
    .insert({
      status: "draft",
      slug: input.slug,
      category_id: input.categoryId,
      h1: input.h1 ?? null,
      meta_description: input.metaDescription ?? null,
      canonical_url: input.canonicalUrl ?? null,
      short_description: input.shortDescription ?? null,
      featured_image_url: input.featuredImage?.url ?? null,
      featured_image_alt: input.featuredImage?.alt ?? null,
      featured_image_metadata: input.featuredImage?.metadata ?? {},
      author_id: input.authorId ?? null,
      content_markdown: input.contentMarkdown ?? null,
      schema_override: input.schemaOverride ?? null,
      seo: input.seo ?? {},
      created_by: userId,
      updated_by: userId,
    })
    .select("id")
    .single();

  if (error || !data?.id) {
    throw new HttpError(400, "BLOG_POST_CREATE_FAILED", "Could not create draft blog post.", error?.message);
  }

  return data.id;
}

export async function replaceBlogPostTags(userClient: SupabaseClient, postId: string, tags: string[]): Promise<void> {
  const { error: deleteError } = await userClient.from("blog_post_tags").delete().eq("blog_post_id", postId);
  if (deleteError) {
    throw new HttpError(400, "BLOG_TAGS_CLEAR_FAILED", "Could not reset blog post tags.", deleteError.message);
  }

  if (tags.length === 0) {
    return;
  }

  const rows = tags.map((tagId) => ({ blog_post_id: postId, tag_id: tagId }));
  const { error: insertError } = await userClient.from("blog_post_tags").insert(rows);
  if (insertError) {
    throw new HttpError(400, "BLOG_TAGS_INSERT_FAILED", "Could not assign tags to blog post.", insertError.message);
  }
}

export async function replaceBlogFaqs(userClient: SupabaseClient, postId: string, faqs: BlogFaqPayload[]): Promise<void> {
  const { error: deleteError } = await userClient.from("blog_faqs").delete().eq("blog_post_id", postId);
  if (deleteError) {
    throw new HttpError(400, "BLOG_FAQS_CLEAR_FAILED", "Could not reset blog FAQs.", deleteError.message);
  }

  if (faqs.length === 0) {
    return;
  }

  const rows = faqs.map((faq, index) => ({
    blog_post_id: postId,
    position: faq.position ?? index,
    question: faq.question,
    answer: faq.answer,
  }));

  const { error: insertError } = await userClient.from("blog_faqs").insert(rows);
  if (insertError) {
    throw new HttpError(400, "BLOG_FAQS_INSERT_FAILED", "Could not assign FAQs to blog post.", insertError.message);
  }
}

export async function getBlogPostSummary(userClient: SupabaseClient, postId: string): Promise<BlogPostSummary> {
  const { data, error } = await userClient
    .from("blog_posts")
    .select("id, status, slug, category_slug, publish_date, updated_at")
    .eq("id", postId)
    .single();

  if (error || !data) {
    throw new HttpError(404, "BLOG_POST_NOT_FOUND", "Blog post not found after write.", error?.message);
  }

  return data as BlogPostSummary;
}

