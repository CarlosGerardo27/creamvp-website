// @ts-nocheck
import { expectRecord, expectUuid, optionalString } from "../../_shared/validators.ts";

export type DeleteBlogInput = {
  postId: string;
  changeReason?: string | null;
};

export function validateDeleteBlogPayload(value: unknown): DeleteBlogInput {
  const payload = expectRecord(value);
  const postId = expectUuid(payload.postId, "postId");
  const changeReason = optionalString(payload.changeReason, "changeReason");

  return {
    postId,
    changeReason,
  };
}

