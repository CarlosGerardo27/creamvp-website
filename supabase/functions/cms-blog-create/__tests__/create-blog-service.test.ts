// @ts-nocheck
import { assertEquals, assertRejects } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { HttpError } from "../../_shared/errors.ts";
import { createDraftBlogPost } from "../services/create-blog-service.ts";
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
    requestId: "req-create-service-test",
  };
}

Deno.test("createDraftBlogPost crea draft con tags y FAQs para rol editor", async () => {
  const state = createFakeDbState();
  const context = buildContext("editor", state);

  const result = await createDraftBlogPost(context, {
    slug: "entrada-cms-prueba",
    categoryId: "cat-1",
    h1: "Entrada CMS prueba",
    metaDescription: "Meta",
    shortDescription: "Resumen",
    contentMarkdown: "## Contenido",
    tags: ["tag-1", "tag-2"],
    faqs: [
      { question: "Que incluye?", answer: "Incluye pruebas.", position: 0 },
      { question: "Es SEO friendly?", answer: "Si.", position: 1 },
    ],
  });

  assertEquals(result.status, "draft");
  assertEquals(state.blog_posts.length, 1);
  assertEquals(state.blog_post_tags.length, 2);
  assertEquals(state.blog_faqs.length, 2);
});

Deno.test("createDraftBlogPost rechaza rol sin permisos", async () => {
  const state = createFakeDbState();
  const context = buildContext("reviewer", state);

  const error = await assertRejects(
    () =>
      createDraftBlogPost(context, {
        slug: "no-permitido",
        categoryId: "cat-1",
      }),
    HttpError,
  );

  assertEquals(error.status, 403);
  assertEquals(error.code, "INSUFFICIENT_ROLE");
});

Deno.test("createDraftBlogPost aplica rate limit por endpoint", async () => {
  const nowIso = new Date().toISOString();
  const state = createFakeDbState({
    cms_api_request_log: Array.from({ length: 30 }).map((_, index) => ({
      id: `log-${index + 1}`,
      endpoint: "cms-blog-create",
      user_id: "user-editorial-1",
      created_at: nowIso,
    })),
  });
  const context = buildContext("admin", state);

  const error = await assertRejects(
    () =>
      createDraftBlogPost(context, {
        slug: "bloqueado-por-rate-limit",
        categoryId: "cat-1",
      }),
    HttpError,
  );

  assertEquals(error.status, 429);
  assertEquals(error.code, "RATE_LIMIT_EXCEEDED");
});

