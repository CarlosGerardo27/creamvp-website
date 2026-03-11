// @ts-nocheck
import type { AuthContext } from "../../_shared/auth.ts";
import { HttpError } from "../../_shared/errors.ts";
import { enforceRateLimit } from "../../_shared/rate-limit.ts";
import {
  getBlogPostDetailsById,
  getBlogPostDetailsByRoute,
  type BlogPostDetails,
} from "../repositories/get-blog-post-repository.ts";
import type { BlogPostQueryInput } from "../validators/get-blog-post-validator.ts";

export async function getBlogPostDetails(context: AuthContext, input: BlogPostQueryInput): Promise<BlogPostDetails> {
  await enforceRateLimit(context.serviceClient, {
    endpoint: "cms-blog-post",
    userId: context.user.id,
    maxRequests: 120,
    windowSeconds: 60,
  });

  const post =
    input.mode === "by-id"
      ? await getBlogPostDetailsById(context.userClient, input.postId)
      : await getBlogPostDetailsByRoute(context.userClient, input.categorySlug, input.slug);

  if (!post) {
    throw new HttpError(404, "BLOG_POST_NOT_FOUND", "Blog post not found.");
  }

  return post;
}

