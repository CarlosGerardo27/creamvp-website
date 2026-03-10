// @ts-nocheck
import type { SupabaseClient } from "npm:@supabase/supabase-js@2";
import { HttpError } from "../../_shared/errors.ts";
import type { BlogPostStatus, BlogFaqPayload } from "../../_shared/cms-blog-types.ts";
import type { BlogPostPatch } from "../validators/update-blog-validator.ts";

export type BlogPostForUpdate = {
  id: string;
  status: BlogPostStatus;
};

export type BlogPostSummary = {
  id: string;
  status: BlogPostStatus;
  slug: string;
  category_slug: string;
  publish_date: string | null;
  updated_at: string;
};

export async function getBlogPostForUpdate(userClient: SupabaseClient, postId: string): Promise<BlogPostForUpdate> {
  const { data, error } = await userClient.from("blog_posts").select("id, status").eq("id", postId).single();
  if (error || !data) {
    throw new HttpError(404, "BLOG_POST_NOT_FOUND", "Blog post not found.", error?.message);
  }
  return data as BlogPostForUpdate;
}

function mapPatchToRow(patch: BlogPostPatch, userId: string): Record<string, unknown> {
  const row: Record<string, unknown> = { updated_by: userId };

  if (patch.slug !== undefined) row.slug = patch.slug;
  if (patch.categoryId !== undefined) row.category_id = patch.categoryId;
  if (patch.h1 !== undefined) row.h1 = patch.h1;
  if (patch.metaDescription !== undefined) row.meta_description = patch.metaDescription;
  if (patch.canonicalUrl !== undefined) row.canonical_url = patch.canonicalUrl;
  if (patch.shortDescription !== undefined) row.short_description = patch.shortDescription;
  if (patch.featuredImage !== undefined) {
    row.featured_image_url = patch.featuredImage?.url ?? null;
    row.featured_image_alt = patch.featuredImage?.alt ?? null;
    row.featured_image_metadata = patch.featuredImage?.metadata ?? {};
  }
  if (patch.authorId !== undefined) row.author_id = patch.authorId;
  if (patch.contentMarkdown !== undefined) row.content_markdown = patch.contentMarkdown;
  if (patch.schemaOverride !== undefined) row.schema_override = patch.schemaOverride;
  if (patch.seo !== undefined) row.seo = patch.seo;

  return row;
}

export async function applyBlogPostPatch(
  userClient: SupabaseClient,
  postId: string,
  patch: BlogPostPatch,
  userId: string,
): Promise<void> {
  const updateRow = mapPatchToRow(patch, userId);

  const { error } = await userClient.from("blog_posts").update(updateRow).eq("id", postId);
  if (error) {
    throw new HttpError(400, "BLOG_POST_UPDATE_FAILED", "Could not update blog post.", error.message);
  }
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
    throw new HttpError(404, "BLOG_POST_NOT_FOUND", "Blog post not found after update.", error?.message);
  }

  return data as BlogPostSummary;
}

