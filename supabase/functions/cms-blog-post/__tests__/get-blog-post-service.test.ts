// @ts-nocheck
import { assertEquals, assertRejects } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { HttpError } from "../../_shared/errors.ts";
import { createFakeDbState, createFakeSupabaseClient } from "../../_shared/__tests__/fake-supabase-client.ts";
import { getBlogPostDetails } from "../services/get-blog-post-service.ts";

function buildContext(state: ReturnType<typeof createFakeDbState>) {
  return {
    user: { id: "user-editorial-1" },
    profile: { id: "user-editorial-1", role: "admin", is_active: true },
    userClient: createFakeSupabaseClient(state),
    serviceClient: createFakeSupabaseClient(state),
    requestId: "req-blog-post-service-test",
  };
}

function seedState() {
  return createFakeDbState({
    categories: [
      { id: "category-1", name: "Automatizacion", slug: "automatizacion", is_active: true },
    ],
    authors: [
      { id: "author-1", name: "Carlos", slug: "carlos", photo_url: "https://img.com/carlos.jpg", is_active: true },
    ],
    tags: [
      { id: "tag-1", name: "IA", slug: "ia", is_active: true },
      { id: "tag-2", name: "Nocode", slug: "nocode", is_active: true },
    ],
    blog_posts: [
      {
        id: "post-1",
        status: "draft",
        slug: "mi-post",
        category_id: "category-1",
        category_slug: "automatizacion",
        h1: "Mi post",
        meta_description: "Meta",
        canonical_url: "https://creamvp.com/blog/automatizacion/mi-post",
        short_description: "Short",
        featured_image_url: "https://img.com/post.jpg",
        featured_image_alt: "Alt",
        featured_image_metadata: {},
        author_id: "author-1",
        content_markdown: "# Hola",
        schema_auto: {},
        schema_override: null,
        seo: {},
        publish_date: null,
        scheduled_publish_at: null,
        created_at: "2026-03-10T00:00:00.000Z",
        updated_at: "2026-03-10T00:00:00.000Z",
        updated_date: "2026-03-10T00:00:00.000Z",
      },
    ],
    blog_post_tags: [
      { blog_post_id: "post-1", tag_id: "tag-1" },
      { blog_post_id: "post-1", tag_id: "tag-2" },
    ],
    blog_faqs: [
      { blog_post_id: "post-1", question: "Q1", answer: "A1", position: 0 },
      { blog_post_id: "post-1", question: "Q2", answer: "A2", position: 1 },
    ],
  });
}

Deno.test("getBlogPostDetails permite lookup por postId", async () => {
  const state = seedState();
  const context = buildContext(state);

  const result = await getBlogPostDetails(context, {
    mode: "by-id",
    postId: "post-1",
  });

  assertEquals(result.id, "post-1");
  assertEquals(result.tags.length, 2);
  assertEquals(result.faqs.length, 2);
  assertEquals(result.category?.slug, "automatizacion");
  assertEquals(result.author?.slug, "carlos");
});

Deno.test("getBlogPostDetails permite lookup por categorySlug + slug", async () => {
  const state = seedState();
  const context = buildContext(state);

  const result = await getBlogPostDetails(context, {
    mode: "by-route",
    categorySlug: "automatizacion",
    slug: "mi-post",
  });

  assertEquals(result.id, "post-1");
});

Deno.test("getBlogPostDetails retorna 404 cuando no existe", async () => {
  const state = seedState();
  const context = buildContext(state);

  const error = await assertRejects(
    () =>
      getBlogPostDetails(context, {
        mode: "by-id",
        postId: "missing-post",
      }),
    HttpError,
  );

  assertEquals(error.status, 404);
  assertEquals(error.code, "BLOG_POST_NOT_FOUND");
});

