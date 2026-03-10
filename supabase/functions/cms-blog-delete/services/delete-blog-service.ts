// @ts-nocheck
import type { AuthContext } from "../../_shared/auth.ts";
import { assertAllowedRole } from "../../_shared/auth.ts";
import { enforceRateLimit } from "../../_shared/rate-limit.ts";
import type { DeleteBlogInput } from "../validators/delete-blog-validator.ts";
import {
  deleteBlogPostById,
  getBlogPostForDelete,
  type BlogPostDeleteSummary,
} from "../repositories/delete-blog-repository.ts";

export async function deleteBlogPost(
  context: AuthContext,
  input: DeleteBlogInput,
): Promise<BlogPostDeleteSummary> {
  await enforceRateLimit(context.serviceClient, {
    endpoint: "cms-blog-delete",
    userId: context.user.id,
    maxRequests: 10,
    windowSeconds: 60,
  });

  assertAllowedRole(context.profile.role, ["admin"]);

  const current = await getBlogPostForDelete(context.userClient, input.postId);
  await deleteBlogPostById(context.userClient, input.postId);

  return current;
}

