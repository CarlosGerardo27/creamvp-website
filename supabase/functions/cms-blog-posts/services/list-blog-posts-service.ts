// @ts-nocheck
import type { AuthContext } from "../../_shared/auth.ts";
import { enforceRateLimit } from "../../_shared/rate-limit.ts";
import {
  readBlogPostsList,
  type BlogPostListResponse,
} from "../repositories/list-blog-posts-repository.ts";
import type { ListBlogPostsQueryInput } from "../validators/list-blog-posts-validator.ts";

export async function listBlogPosts(
  context: AuthContext,
  input: ListBlogPostsQueryInput,
): Promise<BlogPostListResponse> {
  await enforceRateLimit(context.serviceClient, {
    endpoint: "cms-blog-posts",
    userId: context.user.id,
    maxRequests: 120,
    windowSeconds: 60,
  });

  return readBlogPostsList(context.userClient, input);
}

