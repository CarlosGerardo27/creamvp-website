// @ts-nocheck
import { expectRecord, expectStatus, expectUuid, optionalString } from "../../_shared/validators.ts";
import type { BlogPostStatus } from "../../_shared/cms-blog-types.ts";
import { HttpError } from "../../_shared/errors.ts";

export type UpdateBlogStatusInput = {
  postId: string;
  status: BlogPostStatus;
  scheduledPublishAt?: string | null;
  publishDate?: string | null;
  changeReason?: string | null;
};

function validateScheduledDate(value: unknown): string | null | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (value === null) {
    return null;
  }
  if (typeof value !== "string") {
    throw new HttpError(400, "INVALID_SCHEDULED_DATE", "scheduledPublishAt must be ISO date string.");
  }
  const normalized = value.trim();
  const timestamp = Date.parse(normalized);
  if (!Number.isFinite(timestamp)) {
    throw new HttpError(400, "INVALID_SCHEDULED_DATE", "scheduledPublishAt must be a valid ISO date.");
  }
  return new Date(timestamp).toISOString();
}

function validatePublishDate(value: unknown): string | null | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (value === null) {
    return null;
  }
  if (typeof value !== "string") {
    throw new HttpError(400, "INVALID_PUBLISH_DATE", "publishDate must be ISO date string.");
  }
  const normalized = value.trim();
  const timestamp = Date.parse(normalized);
  if (!Number.isFinite(timestamp)) {
    throw new HttpError(400, "INVALID_PUBLISH_DATE", "publishDate must be a valid ISO date.");
  }
  return new Date(timestamp).toISOString();
}

export function validateStatusBlogPayload(value: unknown): UpdateBlogStatusInput {
  const payload = expectRecord(value);
  const postId = expectUuid(payload.postId, "postId");
  const status = expectStatus(payload.status, "status");
  const scheduledPublishAt = validateScheduledDate(payload.scheduledPublishAt);
  const publishDate = validatePublishDate(payload.publishDate);
  const changeReason = optionalString(payload.changeReason, "changeReason");

  if (status === "scheduled" && !scheduledPublishAt) {
    throw new HttpError(
      400,
      "SCHEDULE_DATE_REQUIRED",
      "scheduledPublishAt is required when setting status to scheduled.",
    );
  }

  if (status !== "published" && publishDate !== undefined) {
    throw new HttpError(
      400,
      "PUBLISH_DATE_NOT_ALLOWED",
      "publishDate is only allowed when setting status to published.",
    );
  }

  return { postId, status, scheduledPublishAt, publishDate, changeReason };
}
