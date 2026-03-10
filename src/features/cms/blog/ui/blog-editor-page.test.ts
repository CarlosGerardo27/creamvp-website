import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const buildCanonicalUrlMock = vi.fn();
const createBlogDraftMock = vi.fn();
const createBlogPreviewTokenMock = vi.fn();
const deleteBlogPostMock = vi.fn();
const getBlogPostByIdMock = vi.fn();
const listAuthorOptionsMock = vi.fn();
const listCategoryOptionsMock = vi.fn();
const listTagOptionsMock = vi.fn();
const updateBlogPostMock = vi.fn();
const updateBlogPostStatusMock = vi.fn();

vi.mock("../data/blog-repository", () => ({
  buildCanonicalUrl: (...args: unknown[]) => buildCanonicalUrlMock(...args),
  createBlogDraft: (...args: unknown[]) => createBlogDraftMock(...args),
  createBlogPreviewToken: (...args: unknown[]) => createBlogPreviewTokenMock(...args),
  deleteBlogPost: (...args: unknown[]) => deleteBlogPostMock(...args),
  getBlogPostById: (...args: unknown[]) => getBlogPostByIdMock(...args),
  listAuthorOptions: (...args: unknown[]) => listAuthorOptionsMock(...args),
  listCategoryOptions: (...args: unknown[]) => listCategoryOptionsMock(...args),
  listTagOptions: (...args: unknown[]) => listTagOptionsMock(...args),
  updateBlogPost: (...args: unknown[]) => updateBlogPostMock(...args),
  updateBlogPostStatus: (...args: unknown[]) => updateBlogPostStatusMock(...args),
}));

import { initCmsBlogEditorPage } from "./blog-editor-page";

function renderEditorDom(includeDeleteButton = true): void {
  document.body.innerHTML = `
    <input id="cms-blog-slug" />
    <select id="cms-blog-category-id"></select>
    <input id="cms-blog-h1" />
    <textarea id="cms-blog-meta-description"></textarea>
    <input id="cms-blog-canonical-url" />
    <textarea id="cms-blog-short-description"></textarea>
    <input id="cms-blog-featured-image-url" />
    <input id="cms-blog-featured-image-alt" />
    <select id="cms-blog-author-id"></select>
    <select id="cms-blog-tag-ids" multiple></select>
    <textarea id="cms-blog-content-markdown"></textarea>
    <textarea id="cms-blog-schema-auto"></textarea>
    <textarea id="cms-blog-schema-override"></textarea>
    <div id="cms-blog-faq-list"></div>
    <button id="cms-blog-faq-add" type="button">Agregar FAQ</button>
    <input id="cms-blog-scheduled-at" type="datetime-local" />
    <p id="cms-blog-current-status"></p>
    <p id="cms-blog-current-post-id"></p>
    <p id="cms-blog-message"></p>
    <p id="cms-blog-error"></p>
    <button id="cms-blog-save-draft" type="button">Save Draft</button>
    <button id="cms-blog-schedule" type="button">Schedule</button>
    <button id="cms-blog-publish" type="button">Publish</button>
    <button id="cms-blog-revert" type="button">Revert</button>
    ${includeDeleteButton ? '<button id="cms-blog-delete" type="button">Delete</button>' : ""}
    <button id="cms-blog-preview-generate" type="button">Preview</button>
    <a id="cms-blog-preview-link" class="hidden" href="#"></a>
    <p id="cms-blog-preview-meta"></p>
    <a id="cms-blog-back-link" href="#"></a>
  `;
}

function mockCatalogsAndPost(): void {
  listCategoryOptionsMock.mockResolvedValue([
    { id: "cat-1", name: "Automatizacion", slug: "automatizacion" },
  ]);
  listAuthorOptionsMock.mockResolvedValue([{ id: "author-1", name: "Carlos", slug: "carlos" }]);
  listTagOptionsMock.mockResolvedValue([{ id: "tag-1", name: "IA", slug: "ia" }]);

  getBlogPostByIdMock.mockResolvedValue({
    id: "post-1",
    status: "draft",
    slug: "post-prueba",
    category_id: "cat-1",
    category_slug: "automatizacion",
    h1: "Post prueba",
    meta_description: "Meta descripcion",
    canonical_url: "https://creamvp.com/blog/automatizacion/post-prueba",
    short_description: "Resumen",
    featured_image_url: "https://images.example.com/post.jpg",
    featured_image_alt: "Imagen post",
    featured_image_metadata: null,
    author_id: "author-1",
    content_markdown: "Contenido",
    schema_auto: null,
    schema_override: null,
    seo: null,
    publish_date: null,
    scheduled_publish_at: null,
    updated_at: "2026-03-10T04:00:00.000Z",
    tags: ["tag-1"],
    faqs: [
      {
        question: "Pregunta",
        answer: "Respuesta",
        position: 0,
      },
    ],
  });
}

describe("cms/blog/ui/blog-editor-page", () => {
  beforeEach(() => {
    renderEditorDom();
    buildCanonicalUrlMock.mockReset();
    createBlogDraftMock.mockReset();
    createBlogPreviewTokenMock.mockReset();
    deleteBlogPostMock.mockReset();
    getBlogPostByIdMock.mockReset();
    listAuthorOptionsMock.mockReset();
    listCategoryOptionsMock.mockReset();
    listTagOptionsMock.mockReset();
    updateBlogPostMock.mockReset();
    updateBlogPostStatusMock.mockReset();
    buildCanonicalUrlMock.mockImplementation(
      (categorySlug: string, slug: string) => `https://creamvp.com/blog/${categorySlug}/${slug}`,
    );
    updateBlogPostStatusMock.mockImplementation(async (input: { postId: string; status: string }) => ({
      id: input.postId,
      status: input.status,
      slug: "post-prueba",
      category_slug: "automatizacion",
      publish_date: null,
      updated_at: new Date().toISOString(),
    }));
    createBlogDraftMock.mockResolvedValue({
      id: "post-new",
      status: "draft",
      slug: "post-prueba",
      category_slug: "automatizacion",
      publish_date: null,
      updated_at: new Date().toISOString(),
    });
    vi.spyOn(window, "confirm").mockReturnValue(true);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    document.body.innerHTML = "";
  });

  it("ejecuta publish y revert to draft en modo edicion", async () => {
    mockCatalogsAndPost();
    window.history.pushState({}, "", "/cms/blog/post-1");

    await initCmsBlogEditorPage("edit", { postId: "post-1" });

    const publishButton = document.getElementById("cms-blog-publish") as HTMLButtonElement;
    const revertButton = document.getElementById("cms-blog-revert") as HTMLButtonElement;
    const currentStatus = document.getElementById("cms-blog-current-status") as HTMLElement;

    publishButton.click();
    await vi.waitFor(() =>
      expect(updateBlogPostStatusMock).toHaveBeenCalledWith({
        postId: "post-1",
        status: "published",
        changeReason: "Publicacion desde CMS UI",
      }),
    );
    expect(currentStatus.textContent).toBe("published");

    revertButton.click();
    await vi.waitFor(() =>
      expect(updateBlogPostStatusMock).toHaveBeenCalledWith({
        postId: "post-1",
        status: "draft",
        changeReason: "Revertido desde CMS UI",
      }),
    );
    expect(currentStatus.textContent).toBe("draft");
  });

  it("crea draft en modo create con slug y categoria", async () => {
    renderEditorDom(false);
    listCategoryOptionsMock.mockResolvedValue([
      { id: "cat-1", name: "Automatizacion", slug: "automatizacion" },
    ]);
    listAuthorOptionsMock.mockResolvedValue([{ id: "author-1", name: "Carlos", slug: "carlos" }]);
    listTagOptionsMock.mockResolvedValue([{ id: "tag-1", name: "IA", slug: "ia" }]);
    window.history.pushState({}, "", "/cms/blog/new");
    await initCmsBlogEditorPage("create");

    const slugInput = document.getElementById("cms-blog-slug") as HTMLInputElement;
    const categorySelect = document.getElementById("cms-blog-category-id") as HTMLSelectElement;
    const saveDraftButton = document.getElementById("cms-blog-save-draft") as HTMLButtonElement;

    slugInput.value = "post-nuevo";
    categorySelect.value = "cat-1";
    saveDraftButton.click();

    await vi.waitFor(() =>
      expect(createBlogDraftMock).toHaveBeenCalledWith(
        expect.objectContaining({
          slug: "post-nuevo",
          categoryId: "cat-1",
        }),
      ),
    );
    expect(createBlogDraftMock).toHaveBeenCalledTimes(1);
  });

  it("muestra error si se intenta publicar sin postId", async () => {
    renderEditorDom(false);
    listCategoryOptionsMock.mockResolvedValue([
      { id: "cat-1", name: "Automatizacion", slug: "automatizacion" },
    ]);
    listAuthorOptionsMock.mockResolvedValue([{ id: "author-1", name: "Carlos", slug: "carlos" }]);
    listTagOptionsMock.mockResolvedValue([{ id: "tag-1", name: "IA", slug: "ia" }]);

    window.history.pushState({}, "", "/cms/blog/new");

    await initCmsBlogEditorPage("create");

    const publishButton = document.getElementById("cms-blog-publish") as HTMLButtonElement;
    const errorEl = document.getElementById("cms-blog-error") as HTMLElement;

    publishButton.click();
    expect(errorEl.textContent).toContain("Primero guarda el draft para obtener ID");
    expect(updateBlogPostStatusMock).not.toHaveBeenCalled();
  });
});
