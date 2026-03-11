// @ts-nocheck
import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { getCatalogs } from "../services/get-catalogs-service.ts";
import { createFakeDbState, createFakeSupabaseClient } from "../../_shared/__tests__/fake-supabase-client.ts";

function buildContext(state: ReturnType<typeof createFakeDbState>) {
  return {
    user: { id: "user-editorial-1" },
    profile: { id: "user-editorial-1", role: "admin", is_active: true },
    userClient: createFakeSupabaseClient(state),
    serviceClient: createFakeSupabaseClient(state),
    requestId: "req-catalogs-service-test",
  };
}

Deno.test("getCatalogs retorna solo activos por defecto", async () => {
  const state = createFakeDbState({
    categories: [
      { id: "cat-1", name: "Activa", slug: "activa", is_active: true, updated_at: "2026-03-01T00:00:00.000Z" },
      { id: "cat-2", name: "Inactiva", slug: "inactiva", is_active: false, updated_at: "2026-03-01T00:00:00.000Z" },
    ],
    authors: [
      { id: "author-1", name: "Autor A", slug: "autor-a", is_active: true, updated_at: "2026-03-01T00:00:00.000Z" },
      { id: "author-2", name: "Autor B", slug: "autor-b", is_active: false, updated_at: "2026-03-01T00:00:00.000Z" },
    ],
    tags: [
      { id: "tag-1", name: "Tag A", slug: "tag-a", is_active: true, updated_at: "2026-03-01T00:00:00.000Z" },
      { id: "tag-2", name: "Tag B", slug: "tag-b", is_active: false, updated_at: "2026-03-01T00:00:00.000Z" },
    ],
  });
  const context = buildContext(state);

  const result = await getCatalogs(context, {
    catalog: "all",
    includeInactive: false,
  });

  assertEquals(result.categories.length, 1);
  assertEquals(result.authors.length, 1);
  assertEquals(result.tags.length, 1);
});

Deno.test("getCatalogs respeta filtro catalog=tags", async () => {
  const state = createFakeDbState({
    tags: [{ id: "tag-1", name: "Tag A", slug: "tag-a", is_active: true, updated_at: "2026-03-01T00:00:00.000Z" }],
  });
  const context = buildContext(state);

  const result = await getCatalogs(context, {
    catalog: "tags",
    includeInactive: true,
  });

  assertEquals(result.categories.length, 0);
  assertEquals(result.authors.length, 0);
  assertEquals(result.tags.length, 1);
});

