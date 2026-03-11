// @ts-nocheck
import type { SupabaseClient } from "npm:@supabase/supabase-js@2";
import { HttpError } from "../../_shared/errors.ts";
import type { BlogPostStatus } from "../../_shared/cms-blog-types.ts";

export type BlogPostCurrentStatus = {
  id: string;
  status: BlogPostStatus;
  slug: string;
  category_slug: string;
};

export type BlogPostSummary = {
  id: string;
  status: BlogPostStatus;
  slug: string;
  category_slug: string;
  publish_date: string | null;
  scheduled_publish_at: string | null;
  updated_at: string;
};

export async function getCurrentBlogPostStatus(
  userClient: SupabaseClient,
  postId: string,
): Promise<BlogPostCurrentStatus> {
  const { data, error } = await userClient
    .from("blog_posts")
    .select("id, status, slug, category_slug")
    .eq("id", postId)
    .single();

  if (error || !data) {
    throw new HttpError(404, "BLOG_POST_NOT_FOUND", "Blog post not found.", error?.message);
  }

  return data as BlogPostCurrentStatus;
}

export async function updateBlogPostStatus(
  userClient: SupabaseClient,
  postId: string,
  status: BlogPostStatus,
  scheduledPublishAt: string | null | undefined,
  publishDate: string | null | undefined,
  userId: string,
): Promise<void> {
  const updateRow: Record<string, unknown> = {
    status,
    updated_by: userId,
  };

  if (status === "scheduled") {
    updateRow.scheduled_publish_at = scheduledPublishAt ?? null;
  } else {
    updateRow.scheduled_publish_at = null;
  }

  if (status === "published" && publishDate !== undefined) {
    updateRow.publish_date = publishDate;
  }

  const { error } = await userClient.from("blog_posts").update(updateRow).eq("id", postId);
  if (error) {
    throw new HttpError(400, "BLOG_STATUS_UPDATE_FAILED", "Could not update blog status.", error.message);
  }
}

export async function getBlogPostSummary(userClient: SupabaseClient, postId: string): Promise<BlogPostSummary> {
  const { data, error } = await userClient
    .from("blog_posts")
    .select("id, status, slug, category_slug, publish_date, scheduled_publish_at, updated_at")
    .eq("id", postId)
    .single();

  if (error || !data) {
    throw new HttpError(404, "BLOG_POST_NOT_FOUND", "Blog post not found after status update.", error?.message);
  }

  return data as BlogPostSummary;
}
