// @ts-nocheck
import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { createFakeDbState, createFakeSupabaseClient } from "../../_shared/__tests__/fake-supabase-client.ts";
import { listBlogPosts } from "../services/list-blog-posts-service.ts";

function buildContext(state: ReturnType<typeof createFakeDbState>) {
  return {
    user: { id: "user-editorial-1" },
    profile: { id: "user-editorial-1", role: "admin", is_active: true },
    userClient: createFakeSupabaseClient(state),
    serviceClient: createFakeSupabaseClient(state),
    requestId: "req-list-blog-posts-service-test",
  };
}

function seedState() {
  return createFakeDbState({
    categories: [
      { id: "category-1", name: "Automatizacion", slug: "automatizacion", is_active: true },
    ],
    authors: [
      { id: "author-1", name: "Carlos", slug: "carlos", is_active: true },
    ],
    blog_posts: [
      {
        id: "post-1",
        status: "draft",
        slug: "post-borrador",
        category_id: "category-1",
        category_slug: "automatizacion",
        h1: "Post borrador",
        meta_description: "meta 1",
        short_description: "desc 1",
        publish_date: null,
        scheduled_publish_at: null,
        author_id: "author-1",
        created_at: "2026-03-10T00:00:00.000Z",
        updated_at: "2026-03-10T00:00:00.000Z",
      },
      {
        id: "post-2",
        status: "published",
        slug: "post-publicado",
        category_id: "category-1",
        category_slug: "automatizacion",
        h1: "Post publicado",
        meta_description: "meta 2",
        short_description: "desc 2",
        publish_date: "2026-03-01T00:00:00.000Z",
        scheduled_publish_at: null,
        author_id: "author-1",
        created_at: "2026-03-10T00:00:00.000Z",
        updated_at: "2026-03-11T00:00:00.000Z",
      },
    ],
  });
}

Deno.test("listBlogPosts permite filtrar por status", async () => {
  const state = seedState();
  const context = buildContext(state);

  const result = await listBlogPosts(context, {
    status: "draft",
    categorySlug: null,
    authorId: null,
    search: null,
    limit: 20,
    offset: 0,
    sort: "updated_desc",
  });

  assertEquals(result.items.length, 1);
  assertEquals(result.items[0].id, "post-1");
  assertEquals(result.pagination.total, 1);
});

Deno.test("listBlogPosts aplica search y pagina", async () => {
  const state = seedState();
  const context = buildContext(state);

  const result = await listBlogPosts(context, {
    status: "all",
    categorySlug: null,
    authorId: null,
    search: "publicado",
    limit: 10,
    offset: 0,
    sort: "updated_desc",
  });

  assertEquals(result.items.length, 1);
  assertEquals(result.items[0].id, "post-2");
  assertEquals(result.items[0].route_path, "/blog/automatizacion/post-publicado");
});

Deno.test("listBlogPosts informa hasMore en paginacion", async () => {
  const state = seedState();
  const context = buildContext(state);

  const result = await listBlogPosts(context, {
    status: "all",
    categorySlug: null,
    authorId: null,
    search: null,
    limit: 1,
    offset: 0,
    sort: "updated_desc",
  });

  assertEquals(result.items.length, 1);
  assertEquals(result.pagination.total, 2);
  assertEquals(result.pagination.hasMore, true);
});

