// @ts-nocheck
import type { AuthContext } from "../../_shared/auth.ts";
import { HttpError } from "../../_shared/errors.ts";
import { isAllowedStatusTransition, isRoleAllowedForStatusTransition, listAllowedTransitions } from "../../_shared/cms-blog-transitions.ts";
import { enforceRateLimit } from "../../_shared/rate-limit.ts";
import type { UpdateBlogStatusInput } from "../validators/status-blog-validator.ts";
import {
  getBlogPostSummary,
  getCurrentBlogPostStatus,
  updateBlogPostStatus,
  type BlogPostSummary,
} from "../repositories/status-blog-repository.ts";

export async function changeBlogPostStatus(context: AuthContext, input: UpdateBlogStatusInput): Promise<BlogPostSummary> {
  await enforceRateLimit(context.serviceClient, {
    endpoint: "cms-blog-status",
    userId: context.user.id,
    maxRequests: 30,
    windowSeconds: 60,
  });

  const current = await getCurrentBlogPostStatus(context.userClient, input.postId);

  if (current.status === input.status) {
    throw new HttpError(409, "STATUS_UNCHANGED", "Current status is already the requested status.", {
      currentStatus: current.status,
      requestedStatus: input.status,
    });
  }

  if (!isAllowedStatusTransition(current.status, input.status)) {
    throw new HttpError(409, "STATUS_TRANSITION_NOT_ALLOWED", "Invalid status transition.", {
      from: current.status,
      to: input.status,
      allowedTransitions: listAllowedTransitions(),
    });
  }

  if (!isRoleAllowedForStatusTransition(context.profile.role, current.status, input.status)) {
    throw new HttpError(
      403,
      "ROLE_CANNOT_CHANGE_STATUS",
      "User role cannot execute this status transition.",
      {
        role: context.profile.role,
        from: current.status,
        to: input.status,
      },
    );
  }

  await updateBlogPostStatus(
    context.userClient,
    input.postId,
    input.status,
    input.scheduledPublishAt,
    input.publishDate,
    context.user.id,
  );

  return getBlogPostSummary(context.userClient, input.postId);
}
