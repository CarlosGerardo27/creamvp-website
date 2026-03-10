// @ts-nocheck
import {
  assertEquals,
  assertThrows,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import { expectSlug, expectStatus, expectUuid } from "../validators.ts";
import { HttpError } from "../errors.ts";

Deno.test("expectUuid accepts valid UUID", () => {
  const value = expectUuid("add3e091-18c0-43cd-aa6f-f733bea5149f", "id");
  assertEquals(value, "add3e091-18c0-43cd-aa6f-f733bea5149f");
});

Deno.test("expectUuid rejects invalid UUID", () => {
  assertThrows(
    () => expectUuid("not-a-uuid", "id"),
    HttpError,
    "must be a valid UUID",
  );
});

Deno.test("expectSlug validates blog slug format", () => {
  assertEquals(expectSlug("mi-slug-123", "slug"), "mi-slug-123");
  assertThrows(() => expectSlug("Mi Slug", "slug"), HttpError);
});

Deno.test("expectStatus validates allowed values", () => {
  assertEquals(expectStatus("draft", "status"), "draft");
  assertThrows(() => expectStatus("archived", "status"), HttpError);
});

