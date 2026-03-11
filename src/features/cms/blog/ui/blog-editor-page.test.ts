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
    <button id="cms-blog-tags-toggle" type="button">Seleccionar tags</button>
    <div id="cms-blog-tags-dropdown" class="hidden">
      <input id="cms-blog-tags-search" />
      <div id="cms-blog-tags-options"></div>
    </div>
    <div id="cms-blog-tags-selected"></div>
    <p id="cms-blog-tags-empty"></p>
    <button id="cms-blog-tags-apply" type="button">Actualizar tags</button>
    <select id="cms-blog-tag-ids" multiple></select>
    <textarea id="cms-blog-content-markdown"></textarea>
    <textarea id="cms-blog-schema-auto"></textarea>
    <textarea id="cms-blog-schema-override"></textarea>
    <div id="cms-blog-faq-list"></div>
    <button id="cms-blog-faq-add" type="button">Agregar FAQ</button>
    <input id="cms-blog-scheduled-at" type="datetime-local" />
    <input id="cms-blog-publish-date" type="datetime-local" />
    <p id="cms-blog-current-status"></p>
    <p id="cms-blog-current-post-id"></p>
    <p id="cms-blog-message"></p>
    <p id="cms-blog-error"></p>
    <button id="cms-blog-save-draft" type="button">Save Draft</button>
    <button id="cms-blog-schedule" type="button">Schedule</button>
    <button id="cms-blog-publish" type="button">Publish</button>
    <button id="cms-blog-publish-changes" type="button">Publicar cambios</button>
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
        publishDate: null,
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

  it("muestra acciones editoriales segun estado draft", async () => {
    mockCatalogsAndPost();
    window.history.pushState({}, "", "/cms/blog/post-1");

    await initCmsBlogEditorPage("edit", { postId: "post-1" });

    const saveDraftButton = document.getElementById("cms-blog-save-draft") as HTMLButtonElement;
    const scheduleButton = document.getElementById("cms-blog-schedule") as HTMLButtonElement;
    const publishButton = document.getElementById("cms-blog-publish") as HTMLButtonElement;
    const publishChangesButton = document.getElementById("cms-blog-publish-changes") as HTMLButtonElement;
    const revertButton = document.getElementById("cms-blog-revert") as HTMLButtonElement;
    const previewButton = document.getElementById("cms-blog-preview-generate") as HTMLButtonElement;

    expect(saveDraftButton.classList.contains("hidden")).toBe(false);
    expect(scheduleButton.classList.contains("hidden")).toBe(false);
    expect(publishButton.classList.contains("hidden")).toBe(false);
    expect(publishChangesButton.classList.contains("hidden")).toBe(true);
    expect(revertButton.classList.contains("hidden")).toBe(true);
    expect(previewButton.classList.contains("hidden")).toBe(false);
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

  it("permite seleccionar, quitar y actualizar tags en modo edicion", async () => {
    mockCatalogsAndPost();
    listTagOptionsMock.mockResolvedValue([
      { id: "tag-1", name: "IA", slug: "ia" },
      { id: "tag-2", name: "Automatizacion", slug: "automatizacion" },
    ]);
    updateBlogPostMock.mockResolvedValue({
      id: "post-1",
      status: "draft",
      slug: "post-prueba",
      category_slug: "automatizacion",
      publish_date: null,
      updated_at: new Date().toISOString(),
    });

    window.history.pushState({}, "", "/cms/blog/post-1");
    await initCmsBlogEditorPage("edit", { postId: "post-1" });

    const toggleTags = document.getElementById("cms-blog-tags-toggle") as HTMLButtonElement;
    toggleTags.click();

    const addTag2 = document.querySelector('input[data-tag-id="tag-2"]') as HTMLInputElement;
    addTag2.click();

    const removeTag1 = document.querySelector('button[data-tag-remove-id="tag-1"]') as HTMLButtonElement;
    removeTag1.click();

    const applyTags = document.getElementById("cms-blog-tags-apply") as HTMLButtonElement;
    applyTags.click();

    await vi.waitFor(() =>
      expect(updateBlogPostMock).toHaveBeenCalledWith({
        postId: "post-1",
        patch: {
          slug: "post-prueba",
        },
        tags: ["tag-2"],
      }),
    );
  });

  it("permite publicar cambios en estado published con fecha de publicacion personalizada", async () => {
    listCategoryOptionsMock.mockResolvedValue([
      { id: "cat-1", name: "Automatizacion", slug: "automatizacion" },
    ]);
    listAuthorOptionsMock.mockResolvedValue([{ id: "author-1", name: "Carlos", slug: "carlos" }]);
    listTagOptionsMock.mockResolvedValue([
      { id: "tag-1", name: "IA", slug: "ia" },
      { id: "tag-2", name: "Automatizacion", slug: "automatizacion" },
    ]);
    getBlogPostByIdMock.mockResolvedValue({
      id: "post-1",
      status: "published",
      slug: "post-prueba",
      category_id: "cat-1",
      category_slug: "automatizacion",
      h1: "Post publicado",
      meta_description: "Meta",
      canonical_url: "https://creamvp.com/blog/automatizacion/post-prueba",
      short_description: "Resumen",
      featured_image_url: null,
      featured_image_alt: null,
      featured_image_metadata: null,
      author_id: "author-1",
      content_markdown: "Contenido",
      schema_auto: null,
      schema_override: null,
      seo: null,
      publish_date: "2026-02-01T10:00:00.000Z",
      scheduled_publish_at: null,
      updated_at: "2026-03-10T04:00:00.000Z",
      tags: ["tag-1"],
      faqs: [],
    });
    updateBlogPostMock.mockResolvedValue({
      id: "post-1",
      status: "draft",
      slug: "post-prueba",
      category_slug: "automatizacion",
      publish_date: null,
      updated_at: new Date().toISOString(),
    });
    updateBlogPostStatusMock.mockImplementation(async (input: { postId: string; status: string; publishDate?: string | null }) => ({
      id: input.postId,
      status: input.status,
      slug: "post-prueba",
      category_slug: "automatizacion",
      publish_date: input.status === "published" ? (input.publishDate ?? "2026-02-01T10:00:00.000Z") : null,
      updated_at: new Date().toISOString(),
    }));

    window.history.pushState({}, "", "/cms/blog/post-1");
    await initCmsBlogEditorPage("edit", { postId: "post-1" });

    const publishButton = document.getElementById("cms-blog-publish") as HTMLButtonElement;
    const publishChangesButton = document.getElementById("cms-blog-publish-changes") as HTMLButtonElement;
    const revertButton = document.getElementById("cms-blog-revert") as HTMLButtonElement;
    const publishDateInput = document.getElementById("cms-blog-publish-date") as HTMLInputElement;

    expect(publishButton.classList.contains("hidden")).toBe(true);
    expect(publishChangesButton.classList.contains("hidden")).toBe(false);
    expect(revertButton.classList.contains("hidden")).toBe(false);

    const expectedPublishDateIso = new Date("2026-01-15T12:30").toISOString();
    publishDateInput.value = "2026-01-15T12:30";
    publishChangesButton.click();

    await vi.waitFor(() => expect(updateBlogPostStatusMock).toHaveBeenCalledTimes(2));
    expect(updateBlogPostStatusMock).toHaveBeenNthCalledWith(1, {
      postId: "post-1",
      status: "draft",
      changeReason: "Revert temporal para publicar cambios",
    });
    expect(updateBlogPostMock).toHaveBeenCalledWith(
      expect.objectContaining({
        postId: "post-1",
        tags: ["tag-1"],
      }),
    );
    expect(updateBlogPostStatusMock).toHaveBeenNthCalledWith(2, {
      postId: "post-1",
      status: "published",
      publishDate: expectedPublishDateIso,
      changeReason: "Publicar cambios desde CMS UI",
    });
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
