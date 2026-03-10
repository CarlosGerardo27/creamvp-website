// @ts-nocheck
import type { SupabaseClient } from "npm:@supabase/supabase-js@2";
import { HttpError } from "../../_shared/errors.ts";
import type { BlogPostStatus } from "../../_shared/cms-blog-types.ts";

export type BlogPostDeleteSummary = {
  id: string;
  status: BlogPostStatus;
  slug: string;
  category_slug: string;
  publish_date: string | null;
  updated_at: string;
};

export async function getBlogPostForDelete(
  userClient: SupabaseClient,
  postId: string,
): Promise<BlogPostDeleteSummary> {
  const { data, error } = await userClient
    .from("blog_posts")
    .select("id, status, slug, category_slug, publish_date, updated_at")
    .eq("id", postId)
    .single();

  if (error || !data) {
    throw new HttpError(404, "BLOG_POST_NOT_FOUND", "Blog post not found.", error?.message);
  }

  return data as BlogPostDeleteSummary;
}

export async function deleteBlogPostById(userClient: SupabaseClient, postId: string): Promise<void> {
  const { error } = await userClient.from("blog_posts").delete().eq("id", postId);
  if (error) {
    throw new HttpError(400, "BLOG_POST_DELETE_FAILED", "Could not delete blog post.", error.message);
  }
}

