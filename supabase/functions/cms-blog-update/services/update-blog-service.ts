// @ts-nocheck
import type { AuthContext } from "../../_shared/auth.ts";
import { assertAllowedRole } from "../../_shared/auth.ts";
import { HttpError } from "../../_shared/errors.ts";
import { enforceRateLimit } from "../../_shared/rate-limit.ts";
import type { UpdateBlogPostInput } from "../validators/update-blog-validator.ts";
import {
  applyBlogPostPatch,
  getBlogPostForUpdate,
  getBlogPostSummary,
  replaceBlogFaqs,
  replaceBlogPostTags,
  type BlogPostSummary,
} from "../repositories/update-blog-repository.ts";

export async function updateBlogPost(context: AuthContext, input: UpdateBlogPostInput): Promise<BlogPostSummary> {
  assertAllowedRole(context.profile.role, ["admin", "editor"]);

  await enforceRateLimit(context.serviceClient, {
    endpoint: "cms-blog-update",
    userId: context.user.id,
    maxRequests: 60,
    windowSeconds: 60,
  });

  const currentPost = await getBlogPostForUpdate(context.userClient, input.postId);
  if (!["draft", "scheduled"].includes(currentPost.status)) {
    throw new HttpError(
      409,
      "UPDATE_REQUIRES_DRAFT_OR_SCHEDULED",
      "Only draft/scheduled posts can be updated with this endpoint. Use status endpoint to revert if needed.",
      { currentStatus: currentPost.status },
    );
  }

  await applyBlogPostPatch(context.userClient, input.postId, input.patch, context.user.id);

  if (input.tags) {
    await replaceBlogPostTags(context.userClient, input.postId, input.tags);
  }

  if (input.faqs) {
    await replaceBlogFaqs(context.userClient, input.postId, input.faqs);
  }

  return getBlogPostSummary(context.userClient, input.postId);
}

