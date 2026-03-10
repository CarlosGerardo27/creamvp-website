// @ts-nocheck
import type { AuthContext } from "../../_shared/auth.ts";
import { assertAllowedRole } from "../../_shared/auth.ts";
import { enforceRateLimit } from "../../_shared/rate-limit.ts";
import type { CreateBlogPostInput } from "../validators/create-blog-validator.ts";
import {
  getBlogPostSummary,
  insertDraftBlogPost,
  replaceBlogFaqs,
  replaceBlogPostTags,
  type BlogPostSummary,
} from "../repositories/create-blog-repository.ts";

export async function createDraftBlogPost(context: AuthContext, input: CreateBlogPostInput): Promise<BlogPostSummary> {
  assertAllowedRole(context.profile.role, ["admin", "editor"]);

  await enforceRateLimit(context.serviceClient, {
    endpoint: "cms-blog-create",
    userId: context.user.id,
    maxRequests: 30,
    windowSeconds: 60,
  });

  const postId = await insertDraftBlogPost(context.userClient, input, context.user.id);

  if (input.tags) {
    await replaceBlogPostTags(context.userClient, postId, input.tags);
  }

  if (input.faqs) {
    await replaceBlogFaqs(context.userClient, postId, input.faqs);
  }

  return getBlogPostSummary(context.userClient, postId);
}

