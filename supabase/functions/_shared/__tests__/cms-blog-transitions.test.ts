// @ts-nocheck
import { assert, assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  isAllowedStatusTransition,
  isRoleAllowedForStatusTransition,
} from "../cms-blog-transitions.ts";

Deno.test("allowed status transitions should match editorial rules", () => {
  assert(isAllowedStatusTransition("draft", "published"));
  assert(isAllowedStatusTransition("published", "draft"));
  assert(isAllowedStatusTransition("draft", "scheduled"));
  assert(isAllowedStatusTransition("scheduled", "published"));
  assertEquals(isAllowedStatusTransition("published", "scheduled"), false);
});

Deno.test("role-based transition permissions should be enforced", () => {
  assert(isRoleAllowedForStatusTransition("reviewer", "draft", "published"));
  assert(isRoleAllowedForStatusTransition("editor", "draft", "scheduled"));
  assertEquals(isRoleAllowedForStatusTransition("editor", "draft", "published"), false);
  assertEquals(isRoleAllowedForStatusTransition("developer", "draft", "scheduled"), false);
});

