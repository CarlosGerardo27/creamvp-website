// @ts-nocheck
import { assertEquals, assertThrows } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { HttpError } from "../../_shared/errors.ts";
import { validateDeleteBlogPayload } from "../validators/delete-blog-validator.ts";

Deno.test("validateDeleteBlogPayload acepta payload minimo valido", () => {
  const payload = validateDeleteBlogPayload({
    postId: "add3e091-18c0-43cd-aa6f-f733bea5149f",
  });

  assertEquals(payload.postId, "add3e091-18c0-43cd-aa6f-f733bea5149f");
  assertEquals(payload.changeReason, undefined);
});

Deno.test("validateDeleteBlogPayload rechaza postId invalido", () => {
  assertThrows(
    () =>
      validateDeleteBlogPayload({
        postId: "not-valid",
      }),
    HttpError,
    "must be a valid UUID",
  );
});

