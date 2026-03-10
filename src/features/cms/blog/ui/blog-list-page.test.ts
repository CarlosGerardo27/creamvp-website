import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const listBlogPostsMock = vi.fn();
const deleteBlogPostMock = vi.fn();

vi.mock("../data/blog-repository", () => ({
  listBlogPosts: (...args: unknown[]) => listBlogPostsMock(...args),
  deleteBlogPost: (...args: unknown[]) => deleteBlogPostMock(...args),
}));

import { initCmsBlogListPage } from "./blog-list-page";

function renderListDom(): void {
  document.body.innerHTML = `
    <input id="cms-blog-search" />
    <select id="cms-blog-status-filter">
      <option value="all">Todos</option>
      <option value="draft">Draft</option>
      <option value="scheduled">Scheduled</option>
      <option value="published">Published</option>
    </select>
    <button id="cms-blog-refresh">Refrescar</button>
    <table>
      <tbody id="cms-blog-table-rows"></tbody>
    </table>
    <p id="cms-blog-summary"></p>
    <p id="cms-blog-error"></p>
  `;
}

const samplePosts = [
  {
    id: "post-1",
    status: "draft",
    slug: "post-prueba",
    category_slug: "automatizacion",
    h1: "Post prueba",
    meta_description: "meta",
    publish_date: null,
    updated_at: "2026-03-10T04:00:00.000Z",
  },
];

describe("cms/blog/ui/blog-list-page", () => {
  beforeEach(() => {
    renderListDom();
    listBlogPostsMock.mockReset();
    deleteBlogPostMock.mockReset();
    listBlogPostsMock.mockResolvedValue(samplePosts);
    deleteBlogPostMock.mockResolvedValue({
      id: "post-1",
      status: "draft",
      slug: "post-prueba",
      category_slug: "automatizacion",
      publish_date: null,
      updated_at: "2026-03-10T04:00:00.000Z",
    });
    vi.spyOn(window, "confirm").mockReturnValue(true);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    document.body.innerHTML = "";
  });

  it("abre y cierra el menu de acciones con el mismo boton", async () => {
    await initCmsBlogListPage();
    await vi.waitFor(() => expect(listBlogPostsMock).toHaveBeenCalledTimes(1));

    const toggleButton = document.querySelector(
      '[data-action="toggle-actions-menu"][data-post-id="post-1"]',
    );
    const menu = document.querySelector('[data-menu-for="post-1"]');
    expect(toggleButton).toBeInstanceOf(HTMLButtonElement);
    expect(menu).toBeInstanceOf(HTMLElement);

    const button = toggleButton as HTMLButtonElement;
    const actionMenu = menu as HTMLElement;
    expect(actionMenu.classList.contains("hidden")).toBe(true);

    button.click();
    expect(actionMenu.classList.contains("hidden")).toBe(false);
    expect(button.getAttribute("aria-expanded")).toBe("true");

    button.click();
    expect(actionMenu.classList.contains("hidden")).toBe(true);
    expect(button.getAttribute("aria-expanded")).toBe("false");
  });

  it("ejecuta eliminar y refresca listado", async () => {
    await initCmsBlogListPage();
    await vi.waitFor(() => expect(listBlogPostsMock).toHaveBeenCalledTimes(1));

    const toggleButton = document.querySelector(
      '[data-action="toggle-actions-menu"][data-post-id="post-1"]',
    ) as HTMLButtonElement;
    toggleButton.click();

    const deleteButton = document.querySelector(
      '[data-action="delete-post"][data-post-id="post-1"]',
    ) as HTMLButtonElement;
    deleteButton.click();

    await vi.waitFor(() =>
      expect(deleteBlogPostMock).toHaveBeenCalledWith("post-1", "Delete desde listado CMS"),
    );
    await vi.waitFor(() => expect(listBlogPostsMock).toHaveBeenCalledTimes(2));
    expect(document.getElementById("cms-blog-summary")?.textContent).toContain("post(s) encontrados");
    expect(document.getElementById("cms-blog-error")?.textContent).toBe("");
  });
});
