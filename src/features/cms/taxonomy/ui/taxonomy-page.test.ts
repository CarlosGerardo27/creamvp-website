import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const listCategoriesMock = vi.fn();
const createCategoryMock = vi.fn();
const toggleCategoryActiveMock = vi.fn();
const listTagsMock = vi.fn();
const createTagMock = vi.fn();
const toggleTagActiveMock = vi.fn();
const listAuthorsMock = vi.fn();
const getAuthorByIdMock = vi.fn();
const createAuthorMock = vi.fn();
const updateAuthorMock = vi.fn();
const deleteAuthorMock = vi.fn();
const toggleAuthorActiveMock = vi.fn();

vi.mock("../data/taxonomy-repository", () => ({
  listCategories: (...args: unknown[]) => listCategoriesMock(...args),
  createCategory: (...args: unknown[]) => createCategoryMock(...args),
  toggleCategoryActive: (...args: unknown[]) => toggleCategoryActiveMock(...args),
  listTags: (...args: unknown[]) => listTagsMock(...args),
  createTag: (...args: unknown[]) => createTagMock(...args),
  toggleTagActive: (...args: unknown[]) => toggleTagActiveMock(...args),
  listAuthors: (...args: unknown[]) => listAuthorsMock(...args),
  getAuthorById: (...args: unknown[]) => getAuthorByIdMock(...args),
  createAuthor: (...args: unknown[]) => createAuthorMock(...args),
  updateAuthor: (...args: unknown[]) => updateAuthorMock(...args),
  deleteAuthor: (...args: unknown[]) => deleteAuthorMock(...args),
  toggleAuthorActive: (...args: unknown[]) => toggleAuthorActiveMock(...args),
}));

import { initAuthorEditorPage, initAuthorsListPage } from "./taxonomy-page";

function renderAuthorsListDom(): void {
  document.body.innerHTML = `
    <input id="cms-authors-search" />
    <select id="cms-authors-status-filter">
      <option value="all">Todos</option>
      <option value="active">Activos</option>
      <option value="inactive">Inactivos</option>
    </select>
    <button id="cms-authors-refresh">Refrescar</button>
    <table><tbody id="cms-authors-table-rows"></tbody></table>
    <p id="cms-authors-summary"></p>
    <p id="cms-authors-error"></p>
  `;
}

function renderAuthorEditorDom(): void {
  document.body.innerHTML = `
    <p id="cms-authors-current-id"></p>
    <p id="cms-authors-current-status"></p>
    <input id="cms-authors-name" />
    <input id="cms-authors-slug" />
    <textarea id="cms-authors-bio"></textarea>
    <input id="cms-authors-photo" />
    <input id="cms-authors-facebook" />
    <input id="cms-authors-instagram" />
    <input id="cms-authors-x" />
    <input id="cms-authors-tiktok" />
    <input id="cms-authors-linkedin" />
    <input id="cms-authors-personal" />
    <button id="cms-authors-save">Guardar</button>
    <button id="cms-authors-toggle-active" hidden>Toggle</button>
    <button id="cms-authors-delete" hidden>Eliminar</button>
    <button id="cms-authors-refresh">Refrescar</button>
    <p id="cms-authors-message"></p>
    <p id="cms-authors-error"></p>
  `;
}

const sampleAuthor = {
  id: "author-1",
  name: "Carlos Gerardo Rocha",
  slug: "carlos-gerardo-rocha",
  bio: "Bio autor",
  photo_url: "https://example.com/autor.jpg",
  facebook_url: null,
  instagram_url: null,
  x_url: null,
  tiktok_url: null,
  linkedin_url: null,
  personal_url: null,
  is_active: true,
  updated_at: "2026-03-10T20:00:00.000Z",
};

describe("cms/taxonomy/ui/taxonomy-page authors", () => {
  beforeEach(() => {
    listCategoriesMock.mockReset();
    createCategoryMock.mockReset();
    toggleCategoryActiveMock.mockReset();
    listTagsMock.mockReset();
    createTagMock.mockReset();
    toggleTagActiveMock.mockReset();
    listAuthorsMock.mockReset();
    getAuthorByIdMock.mockReset();
    createAuthorMock.mockReset();
    updateAuthorMock.mockReset();
    deleteAuthorMock.mockReset();
    toggleAuthorActiveMock.mockReset();
    listAuthorsMock.mockResolvedValue([sampleAuthor]);
    getAuthorByIdMock.mockResolvedValue(sampleAuthor);
    createAuthorMock.mockResolvedValue(undefined);
    updateAuthorMock.mockResolvedValue(undefined);
    deleteAuthorMock.mockResolvedValue(undefined);
    toggleAuthorActiveMock.mockResolvedValue(undefined);
    vi.spyOn(window, "confirm").mockReturnValue(true);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    document.body.innerHTML = "";
  });

  it("abre y cierra menu de acciones en listado de autores", async () => {
    renderAuthorsListDom();
    await initAuthorsListPage();
    await vi.waitFor(() => expect(listAuthorsMock).toHaveBeenCalledTimes(1));

    const toggleButton = document.querySelector(
      '[data-action="toggle-actions-menu"][data-author-id="author-1"]',
    ) as HTMLButtonElement;
    const menu = document.querySelector('[data-menu-for="author-1"]') as HTMLElement;

    expect(toggleButton).toBeInstanceOf(HTMLButtonElement);
    expect(menu).toBeInstanceOf(HTMLElement);
    expect(menu.classList.contains("hidden")).toBe(true);

    toggleButton.click();
    expect(menu.classList.contains("hidden")).toBe(false);

    toggleButton.click();
    expect(menu.classList.contains("hidden")).toBe(true);
  });

  it("elimina autor desde listado y recarga resultados", async () => {
    renderAuthorsListDom();
    await initAuthorsListPage();
    await vi.waitFor(() => expect(listAuthorsMock).toHaveBeenCalledTimes(1));

    const toggleButton = document.querySelector(
      '[data-action="toggle-actions-menu"][data-author-id="author-1"]',
    ) as HTMLButtonElement;
    toggleButton.click();

    const deleteButton = document.querySelector(
      '[data-action="delete-author"][data-author-id="author-1"]',
    ) as HTMLButtonElement;
    deleteButton.click();

    await vi.waitFor(() => expect(deleteAuthorMock).toHaveBeenCalledWith("author-1"));
    await vi.waitFor(() => expect(listAuthorsMock).toHaveBeenCalledTimes(2));
    expect(document.getElementById("cms-authors-error")?.textContent).toBe("");
  });

  it("carga autor en modo edit y guarda cambios", async () => {
    renderAuthorEditorDom();
    await initAuthorEditorPage("edit", { authorId: "author-1" });
    await vi.waitFor(() => expect(getAuthorByIdMock).toHaveBeenCalledWith("author-1"));

    const nameInput = document.getElementById("cms-authors-name") as HTMLInputElement;
    const saveButton = document.getElementById("cms-authors-save") as HTMLButtonElement;
    nameInput.value = "Carlos Actualizado";
    saveButton.click();

    await vi.waitFor(() =>
      expect(updateAuthorMock).toHaveBeenCalledWith(
        "author-1",
        expect.objectContaining({
          name: "Carlos Actualizado",
        }),
      ),
    );
  });

  it("crea autor en modo create", async () => {
    renderAuthorEditorDom();
    await initAuthorEditorPage("create");

    (document.getElementById("cms-authors-name") as HTMLInputElement).value = "Nuevo Autor";
    (document.getElementById("cms-authors-slug") as HTMLInputElement).value = "nuevo-autor";
    (document.getElementById("cms-authors-photo") as HTMLInputElement).value = "https://example.com/new.jpg";

    const saveButton = document.getElementById("cms-authors-save") as HTMLButtonElement;
    saveButton.click();

    await vi.waitFor(() =>
      expect(createAuthorMock).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Nuevo Autor",
          slug: "nuevo-autor",
          photoUrl: "https://example.com/new.jpg",
        }),
      ),
    );
  });
});
