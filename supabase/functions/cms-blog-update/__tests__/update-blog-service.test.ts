// @ts-nocheck
import { assertEquals, assertRejects } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { HttpError } from "../../_shared/errors.ts";
import { updateBlogPost } from "../services/update-blog-service.ts";
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
    requestId: "req-update-service-test",
  };
}

function basePost(overrides: Record<string, unknown> = {}) {
  return {
    id: "post-1",
    status: "draft",
    slug: "post-original",
    category_slug: "automatizacion",
    publish_date: null,
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

Deno.test("updateBlogPost actualiza draft y sincroniza tags/faqs", async () => {
  const state = createFakeDbState({
    blog_posts: [basePost()],
    blog_post_tags: [{ blog_post_id: "post-1", tag_id: "tag-old" }],
    blog_faqs: [{ blog_post_id: "post-1", question: "old", answer: "old", position: 0 }],
  });
  const context = buildContext("editor", state);

  const result = await updateBlogPost(context, {
    postId: "post-1",
    patch: {
      slug: "post-actualizado",
      h1: "Post actualizado",
      shortDescription: "Resumen actualizado",
    },
    tags: ["tag-a", "tag-b"],
    faqs: [
      {
        question: "Que cambia?",
        answer: "Se actualiza metadata y contenido.",
        position: 0,
      },
    ],
  });

  assertEquals(result.id, "post-1");
  assertEquals(result.slug, "post-actualizado");
  assertEquals(state.blog_post_tags.length, 2);
  assertEquals(state.blog_faqs.length, 1);
});

Deno.test("updateBlogPost rechaza actualizar post publicado", async () => {
  const state = createFakeDbState({
    blog_posts: [basePost({ status: "published" })],
  });
  const context = buildContext("admin", state);

  const error = await assertRejects(
    () =>
      updateBlogPost(context, {
        postId: "post-1",
        patch: { h1: "No debe permitir" },
      }),
    HttpError,
  );

  assertEquals(error.status, 409);
  assertEquals(error.code, "UPDATE_REQUIRES_DRAFT_OR_SCHEDULED");
});

Deno.test("updateBlogPost rechaza rol reviewer", async () => {
  const state = createFakeDbState({
    blog_posts: [basePost()],
  });
  const context = buildContext("reviewer", state);

  const error = await assertRejects(
    () =>
      updateBlogPost(context, {
        postId: "post-1",
        patch: { h1: "Sin permisos" },
      }),
    HttpError,
  );

  assertEquals(error.status, 403);
  assertEquals(error.code, "INSUFFICIENT_ROLE");
});

