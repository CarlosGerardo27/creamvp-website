// @ts-nocheck
import { assertEquals, assertRejects } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { HttpError } from "../../_shared/errors.ts";
import { changeBlogPostStatus } from "../services/status-blog-service.ts";
import {
  createFakeDbState,
  createFakeSupabaseClient,
  type FakeDbState,
} from "../../_shared/__tests__/fake-supabase-client.ts";

type CmsRole = "admin" | "editor" | "reviewer" | "developer";

function buildContext(role: CmsRole, state: FakeDbState) {
  return {
    user: { id: "user-editorial-1" },
    profile: { id: "user-editorial-1", role, is_active: true },
    userClient: createFakeSupabaseClient(state),
    serviceClient: createFakeSupabaseClient(state),
    requestId: "req-status-service-test",
  };
}

function basePost(overrides: Record<string, unknown> = {}) {
  return {
    id: "post-1",
    status: "draft",
    slug: "post-estado",
    category_slug: "automatizacion",
    publish_date: null,
    scheduled_publish_at: null,
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

Deno.test("changeBlogPostStatus permite draft -> published para admin", async () => {
  const state = createFakeDbState({
    blog_posts: [basePost()],
  });
  const context = buildContext("admin", state);

  const result = await changeBlogPostStatus(context, {
    postId: "post-1",
    status: "published",
    changeReason: "Publicacion editorial",
  });

  assertEquals(result.status, "published");
  assertEquals(state.blog_posts[0]?.status, "published");
  assertEquals(state.blog_posts[0]?.scheduled_publish_at, null);
});

Deno.test("changeBlogPostStatus permite draft -> scheduled para editor", async () => {
  const state = createFakeDbState({
    blog_posts: [basePost()],
  });
  const context = buildContext("editor", state);

  const result = await changeBlogPostStatus(context, {
    postId: "post-1",
    status: "scheduled",
    scheduledPublishAt: "2026-03-20T10:30:00.000Z",
  });

  assertEquals(result.status, "scheduled");
  assertEquals(state.blog_posts[0]?.scheduled_publish_at, "2026-03-20T10:30:00.000Z");
});

Deno.test("changeBlogPostStatus bloquea publish para rol editor", async () => {
  const state = createFakeDbState({
    blog_posts: [basePost()],
  });
  const context = buildContext("editor", state);

  const error = await assertRejects(
    () =>
      changeBlogPostStatus(context, {
        postId: "post-1",
        status: "published",
      }),
    HttpError,
  );

  assertEquals(error.status, 403);
  assertEquals(error.code, "ROLE_CANNOT_CHANGE_STATUS");
});

Deno.test("changeBlogPostStatus bloquea transicion invalida published -> scheduled", async () => {
  const state = createFakeDbState({
    blog_posts: [basePost({ status: "published" })],
  });
  const context = buildContext("admin", state);

  const error = await assertRejects(
    () =>
      changeBlogPostStatus(context, {
        postId: "post-1",
        status: "scheduled",
        scheduledPublishAt: "2026-03-21T13:00:00.000Z",
      }),
    HttpError,
  );

  assertEquals(error.status, 409);
  assertEquals(error.code, "STATUS_TRANSITION_NOT_ALLOWED");
});

