import { assertNonEmpty, assertValidSlug } from "@/features/cms/blog/domain/validators";
import {
  createAuthor,
  createCategory,
  createTag,
  deleteAuthor,
  listAuthors,
  listCategories,
  listTags,
  toggleAuthorActive,
  toggleCategoryActive,
  toggleTagActive,
  updateAuthor,
} from "../data/taxonomy-repository";
import type { CmsAuthorRow } from "../domain/types";

function formatDate(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(parsed);
}

function statusBadge(active: boolean): string {
  return active
    ? `<span class="inline-flex rounded-full border border-emerald-500/40 bg-emerald-500/20 px-2 py-0.5 text-xs text-emerald-300">activo</span>`
    : `<span class="inline-flex rounded-full border border-slate-700 bg-slate-800 px-2 py-0.5 text-xs text-slate-300">inactivo</span>`;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function assertValidHttpUrl(value: string, fieldName: string): void {
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error(`El campo ${fieldName} debe ser una URL valida.`);
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error(`El campo ${fieldName} debe usar http o https.`);
  }
}

type FeedbackNodes = {
  message: HTMLElement;
  error: HTMLElement;
};

function setMessage(feedback: FeedbackNodes, message: string): void {
  feedback.message.textContent = message;
  feedback.error.textContent = "";
}

function setError(feedback: FeedbackNodes, message: string): void {
  feedback.error.textContent = message;
}

function clearFeedback(feedback: FeedbackNodes): void {
  feedback.message.textContent = "";
  feedback.error.textContent = "";
}

export async function initCategoriesPage(): Promise<void> {
  const nameInput = document.getElementById("cms-categories-name");
  const slugInput = document.getElementById("cms-categories-slug");
  const descriptionInput = document.getElementById("cms-categories-description");
  const submitButton = document.getElementById("cms-categories-submit");
  const refreshButton = document.getElementById("cms-categories-refresh");
  const rows = document.getElementById("cms-categories-table-rows");
  const message = document.getElementById("cms-categories-message");
  const error = document.getElementById("cms-categories-error");

  if (
    !(nameInput instanceof HTMLInputElement) ||
    !(slugInput instanceof HTMLInputElement) ||
    !(descriptionInput instanceof HTMLTextAreaElement) ||
    !(submitButton instanceof HTMLButtonElement) ||
    !(refreshButton instanceof HTMLButtonElement) ||
    !(rows instanceof HTMLElement) ||
    !(message instanceof HTMLElement) ||
    !(error instanceof HTMLElement)
  ) {
    return;
  }

  const feedback = { message, error };

  const load = async (): Promise<void> => {
    clearFeedback(feedback);
    refreshButton.disabled = true;
    setMessage(feedback, "Cargando categorias...");
    try {
      const items = await listCategories();
      if (!items.length) {
        rows.innerHTML = `<tr><td colspan="5" class="px-4 py-8 text-center text-slate-400">Sin categorias</td></tr>`;
      } else {
        rows.innerHTML = items
          .map(
            (item) => `
              <tr class="border-b border-slate-800">
                <td class="px-4 py-3">${item.name}</td>
                <td class="px-4 py-3 text-slate-300">${item.slug}</td>
                <td class="px-4 py-3">${statusBadge(item.is_active)}</td>
                <td class="px-4 py-3 text-sm text-slate-300">${formatDate(item.updated_at)}</td>
                <td class="px-4 py-3 text-right">
                  <button class="cms-category-toggle rounded-md border border-slate-700 px-3 py-1.5 text-xs hover:bg-slate-800" data-id="${item.id}" data-active="${item.is_active}">
                    ${item.is_active ? "Desactivar" : "Activar"}
                  </button>
                </td>
              </tr>
            `,
          )
          .join("");
      }
      setMessage(feedback, `${items.length} categoria(s) cargadas`);
    } catch (loadError) {
      const messageText = loadError instanceof Error ? loadError.message : "Error cargando categorias";
      setError(feedback, messageText);
    } finally {
      refreshButton.disabled = false;
    }
  };

  submitButton.addEventListener("click", async () => {
    clearFeedback(feedback);
    submitButton.disabled = true;
    try {
      const name = nameInput.value.trim();
      const slug = slugInput.value.trim();
      assertNonEmpty(name, "nombre");
      assertNonEmpty(slug, "slug");
      assertValidSlug(slug);
      await createCategory({
        name,
        slug,
        description: descriptionInput.value.trim() || undefined,
      });
      nameInput.value = "";
      slugInput.value = "";
      descriptionInput.value = "";
      setMessage(feedback, "Categoria creada.");
      await load();
    } catch (submitError) {
      const messageText = submitError instanceof Error ? submitError.message : "Error creando categoria";
      setError(feedback, messageText);
    } finally {
      submitButton.disabled = false;
    }
  });

  rows.addEventListener("click", async (event) => {
    const target = event.target;
    if (!(target instanceof HTMLButtonElement) || !target.classList.contains("cms-category-toggle")) {
      return;
    }
    const categoryId = target.dataset.id;
    const isActive = target.dataset.active === "true";
    if (!categoryId) {
      return;
    }
    target.disabled = true;
    clearFeedback(feedback);
    try {
      await toggleCategoryActive(categoryId, !isActive);
      await load();
    } catch (toggleError) {
      const messageText = toggleError instanceof Error ? toggleError.message : "Error actualizando categoria";
      setError(feedback, messageText);
    } finally {
      target.disabled = false;
    }
  });

  refreshButton.addEventListener("click", () => {
    void load();
  });

  await load();
}

export async function initTagsPage(): Promise<void> {
  const nameInput = document.getElementById("cms-tags-name");
  const slugInput = document.getElementById("cms-tags-slug");
  const descriptionInput = document.getElementById("cms-tags-description");
  const submitButton = document.getElementById("cms-tags-submit");
  const refreshButton = document.getElementById("cms-tags-refresh");
  const rows = document.getElementById("cms-tags-table-rows");
  const message = document.getElementById("cms-tags-message");
  const error = document.getElementById("cms-tags-error");

  if (
    !(nameInput instanceof HTMLInputElement) ||
    !(slugInput instanceof HTMLInputElement) ||
    !(descriptionInput instanceof HTMLTextAreaElement) ||
    !(submitButton instanceof HTMLButtonElement) ||
    !(refreshButton instanceof HTMLButtonElement) ||
    !(rows instanceof HTMLElement) ||
    !(message instanceof HTMLElement) ||
    !(error instanceof HTMLElement)
  ) {
    return;
  }

  const feedback = { message, error };

  const load = async (): Promise<void> => {
    clearFeedback(feedback);
    refreshButton.disabled = true;
    setMessage(feedback, "Cargando tags...");
    try {
      const items = await listTags();
      rows.innerHTML = items.length
        ? items
            .map(
              (item) => `
              <tr class="border-b border-slate-800">
                <td class="px-4 py-3">${item.name}</td>
                <td class="px-4 py-3 text-slate-300">${item.slug}</td>
                <td class="px-4 py-3">${statusBadge(item.is_active)}</td>
                <td class="px-4 py-3 text-sm text-slate-300">${formatDate(item.updated_at)}</td>
                <td class="px-4 py-3 text-right">
                  <button class="cms-tag-toggle rounded-md border border-slate-700 px-3 py-1.5 text-xs hover:bg-slate-800" data-id="${item.id}" data-active="${item.is_active}">
                    ${item.is_active ? "Desactivar" : "Activar"}
                  </button>
                </td>
              </tr>
            `,
            )
            .join("")
        : `<tr><td colspan="5" class="px-4 py-8 text-center text-slate-400">Sin tags</td></tr>`;
      setMessage(feedback, `${items.length} tag(s) cargados`);
    } catch (loadError) {
      const messageText = loadError instanceof Error ? loadError.message : "Error cargando tags";
      setError(feedback, messageText);
    } finally {
      refreshButton.disabled = false;
    }
  };

  submitButton.addEventListener("click", async () => {
    clearFeedback(feedback);
    submitButton.disabled = true;
    try {
      const name = nameInput.value.trim();
      const slug = slugInput.value.trim();
      assertNonEmpty(name, "nombre");
      assertNonEmpty(slug, "slug");
      assertValidSlug(slug);
      await createTag({
        name,
        slug,
        description: descriptionInput.value.trim() || undefined,
      });
      nameInput.value = "";
      slugInput.value = "";
      descriptionInput.value = "";
      setMessage(feedback, "Tag creado.");
      await load();
    } catch (submitError) {
      const messageText = submitError instanceof Error ? submitError.message : "Error creando tag";
      setError(feedback, messageText);
    } finally {
      submitButton.disabled = false;
    }
  });

  rows.addEventListener("click", async (event) => {
    const target = event.target;
    if (!(target instanceof HTMLButtonElement) || !target.classList.contains("cms-tag-toggle")) {
      return;
    }
    const tagId = target.dataset.id;
    const isActive = target.dataset.active === "true";
    if (!tagId) {
      return;
    }
    target.disabled = true;
    clearFeedback(feedback);
    try {
      await toggleTagActive(tagId, !isActive);
      await load();
    } catch (toggleError) {
      const messageText = toggleError instanceof Error ? toggleError.message : "Error actualizando tag";
      setError(feedback, messageText);
    } finally {
      target.disabled = false;
    }
  });

  refreshButton.addEventListener("click", () => {
    void load();
  });

  await load();
}

export async function initAuthorsPage(): Promise<void> {
  const authorIdInput = document.getElementById("cms-authors-id");
  const nameInput = document.getElementById("cms-authors-name");
  const slugInput = document.getElementById("cms-authors-slug");
  const bioInput = document.getElementById("cms-authors-bio");
  const photoInput = document.getElementById("cms-authors-photo");
  const facebookInput = document.getElementById("cms-authors-facebook");
  const instagramInput = document.getElementById("cms-authors-instagram");
  const xInput = document.getElementById("cms-authors-x");
  const tiktokInput = document.getElementById("cms-authors-tiktok");
  const linkedinInput = document.getElementById("cms-authors-linkedin");
  const personalInput = document.getElementById("cms-authors-personal");
  const submitButton = document.getElementById("cms-authors-submit");
  const cancelButton = document.getElementById("cms-authors-cancel");
  const refreshButton = document.getElementById("cms-authors-refresh");
  const rows = document.getElementById("cms-authors-table-rows");
  const message = document.getElementById("cms-authors-message");
  const error = document.getElementById("cms-authors-error");

  if (
    !(authorIdInput instanceof HTMLInputElement) ||
    !(nameInput instanceof HTMLInputElement) ||
    !(slugInput instanceof HTMLInputElement) ||
    !(bioInput instanceof HTMLTextAreaElement) ||
    !(photoInput instanceof HTMLInputElement) ||
    !(facebookInput instanceof HTMLInputElement) ||
    !(instagramInput instanceof HTMLInputElement) ||
    !(xInput instanceof HTMLInputElement) ||
    !(tiktokInput instanceof HTMLInputElement) ||
    !(linkedinInput instanceof HTMLInputElement) ||
    !(personalInput instanceof HTMLInputElement) ||
    !(submitButton instanceof HTMLButtonElement) ||
    !(cancelButton instanceof HTMLButtonElement) ||
    !(refreshButton instanceof HTMLButtonElement) ||
    !(rows instanceof HTMLElement) ||
    !(message instanceof HTMLElement) ||
    !(error instanceof HTMLElement)
  ) {
    return;
  }

  const feedback = { message, error };
  let editingAuthorId: string | null = null;
  let authorIndex = new Map<string, CmsAuthorRow>();

  const normalizeOptionalText = (value: string): string | undefined => {
    const trimmed = value.trim();
    return trimmed ? trimmed : undefined;
  };

  const normalizeOptionalUrl = (value: string, fieldName: string): string | undefined => {
    const trimmed = value.trim();
    if (!trimmed) {
      return undefined;
    }
    assertValidHttpUrl(trimmed, fieldName);
    return trimmed;
  };

  const closeActionMenus = (): void => {
    const menus = Array.from(rows.querySelectorAll<HTMLElement>("[data-menu-for]"));
    menus.forEach((menu) => menu.classList.add("hidden"));

    const toggles = Array.from(
      rows.querySelectorAll<HTMLButtonElement>('[data-action="toggle-actions-menu"]'),
    );
    toggles.forEach((button) => {
      button.setAttribute("aria-expanded", "false");
    });
  };

  const toggleActionMenu = (authorId: string): void => {
    const menu = rows.querySelector(`[data-menu-for="${authorId}"]`);
    const toggleButton = rows.querySelector(
      `[data-action="toggle-actions-menu"][data-author-id="${authorId}"]`,
    );

    if (!(menu instanceof HTMLElement) || !(toggleButton instanceof HTMLButtonElement)) {
      return;
    }

    const isOpen = !menu.classList.contains("hidden");
    closeActionMenus();

    if (!isOpen) {
      menu.classList.remove("hidden");
      toggleButton.setAttribute("aria-expanded", "true");
      menu.focus();
    }
  };

  const socialLinkCount = (author: CmsAuthorRow): number => {
    return [
      author.facebook_url,
      author.instagram_url,
      author.x_url,
      author.tiktok_url,
      author.linkedin_url,
      author.personal_url,
    ].filter((value) => Boolean(value && value.trim())).length;
  };

  const resetForm = (): void => {
    editingAuthorId = null;
    authorIdInput.value = "";
    nameInput.value = "";
    slugInput.value = "";
    bioInput.value = "";
    photoInput.value = "";
    facebookInput.value = "";
    instagramInput.value = "";
    xInput.value = "";
    tiktokInput.value = "";
    linkedinInput.value = "";
    personalInput.value = "";
    submitButton.textContent = "Crear autor";
    cancelButton.hidden = true;
  };

  const enterEditMode = (author: CmsAuthorRow): void => {
    editingAuthorId = author.id;
    authorIdInput.value = author.id;
    nameInput.value = author.name;
    slugInput.value = author.slug;
    bioInput.value = author.bio ?? "";
    photoInput.value = author.photo_url ?? "";
    facebookInput.value = author.facebook_url ?? "";
    instagramInput.value = author.instagram_url ?? "";
    xInput.value = author.x_url ?? "";
    tiktokInput.value = author.tiktok_url ?? "";
    linkedinInput.value = author.linkedin_url ?? "";
    personalInput.value = author.personal_url ?? "";
    submitButton.textContent = "Guardar cambios";
    cancelButton.hidden = false;
  };

  const load = async (): Promise<void> => {
    clearFeedback(feedback);
    refreshButton.disabled = true;
    setMessage(feedback, "Cargando autores...");
    try {
      const items = await listAuthors();
      authorIndex = new Map(items.map((author) => [author.id, author]));
      rows.innerHTML = items.length
        ? items
            .map((author) => {
              const photoUrl = author.photo_url ? author.photo_url.trim() : "";
              const photoCell = photoUrl
                ? `<a href="${escapeHtml(photoUrl)}" target="_blank" rel="noopener noreferrer" class="text-cyan-300 hover:underline">Ver foto</a>`
                : '<span class="text-rose-300">Falta foto</span>';
              const socialCount = socialLinkCount(author);
              return `
                <tr class="border-b border-slate-800 hover:bg-slate-900/60">
                  <td class="px-4 py-3">
                    <p class="font-medium text-slate-100">${escapeHtml(author.name)}</p>
                    <p class="text-xs text-slate-400">${escapeHtml(author.slug)}</p>
                  </td>
                  <td class="px-4 py-3 text-sm text-slate-300">${photoCell}</td>
                  <td class="px-4 py-3 text-sm text-slate-300">${socialCount}</td>
                  <td class="px-4 py-3">${statusBadge(author.is_active)}</td>
                  <td class="px-4 py-3 text-sm text-slate-300">${formatDate(author.updated_at)}</td>
                  <td class="px-4 py-3 text-right relative">
                    <div class="inline-flex items-center justify-end relative">
                      <button
                        type="button"
                        data-action="toggle-actions-menu"
                        data-author-id="${author.id}"
                        aria-label="Abrir acciones"
                        aria-haspopup="menu"
                        aria-expanded="false"
                        class="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-700 text-slate-300 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-500/60"
                      >
                        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" class="h-4 w-4 pointer-events-none">
                          <circle cx="12" cy="5" r="1.75" />
                          <circle cx="12" cy="12" r="1.75" />
                          <circle cx="12" cy="19" r="1.75" />
                        </svg>
                      </button>
                      <div
                        role="menu"
                        tabindex="-1"
                        data-menu-for="${author.id}"
                        class="hidden absolute right-0 top-10 z-30 min-w-[165px] rounded-xl border border-slate-700/80 bg-slate-900/95 p-1 shadow-2xl backdrop-blur"
                      >
                        <button
                          type="button"
                          role="menuitem"
                          data-action="edit-author"
                          data-author-id="${author.id}"
                          class="block w-full rounded-md px-3 py-2 text-left text-sm text-cyan-300 hover:bg-cyan-500/10"
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          role="menuitem"
                          data-action="toggle-author-active"
                          data-author-id="${author.id}"
                          data-active="${author.is_active}"
                          class="mt-1 block w-full rounded-md px-3 py-2 text-left text-sm text-slate-200 hover:bg-slate-700/30"
                        >
                          ${author.is_active ? "Desactivar" : "Activar"}
                        </button>
                        <button
                          type="button"
                          role="menuitem"
                          data-action="delete-author"
                          data-author-id="${author.id}"
                          data-author-name="${escapeHtml(author.name)}"
                          class="mt-1 block w-full rounded-md px-3 py-2 text-left text-sm text-rose-300 hover:bg-rose-500/10"
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              `;
            })
            .join("")
        : `<tr><td colspan="6" class="px-4 py-8 text-center text-slate-400">Sin autores</td></tr>`;

      if (editingAuthorId && !authorIndex.has(editingAuthorId)) {
        resetForm();
      }
      setMessage(feedback, `${items.length} autor(es) cargados`);
    } catch (loadError) {
      const messageText = loadError instanceof Error ? loadError.message : "Error cargando autores";
      setError(feedback, messageText);
    } finally {
      refreshButton.disabled = false;
    }
  };

  submitButton.addEventListener("click", async () => {
    clearFeedback(feedback);
    submitButton.disabled = true;
    try {
      const name = nameInput.value.trim();
      const slug = slugInput.value.trim();
      const photoUrl = photoInput.value.trim();
      assertNonEmpty(name, "nombre");
      assertNonEmpty(slug, "slug");
      assertNonEmpty(photoUrl, "foto URL");
      assertValidSlug(slug);
      assertValidHttpUrl(photoUrl, "foto URL");

      const payload = {
        name,
        slug,
        photoUrl,
        bio: bioInput.value.trim() || undefined,
        facebookUrl: normalizeOptionalUrl(facebookInput.value, "facebook"),
        instagramUrl: normalizeOptionalUrl(instagramInput.value, "instagram"),
        xUrl: normalizeOptionalUrl(xInput.value, "x"),
        tiktokUrl: normalizeOptionalUrl(tiktokInput.value, "tiktok"),
        linkedinUrl: normalizeOptionalUrl(linkedinInput.value, "linkedin"),
        personalUrl: normalizeOptionalUrl(personalInput.value, "url personal"),
      };

      if (editingAuthorId) {
        await updateAuthor(editingAuthorId, payload);
        setMessage(feedback, "Autor actualizado.");
      } else {
        await createAuthor(payload);
        setMessage(feedback, "Autor creado.");
      }

      resetForm();
      await load();
    } catch (submitError) {
      const messageText = submitError instanceof Error ? submitError.message : "Error creando autor";
      setError(feedback, messageText);
    } finally {
      submitButton.disabled = false;
    }
  });

  cancelButton.addEventListener("click", () => {
    resetForm();
    clearFeedback(feedback);
    setMessage(feedback, "Edicion cancelada.");
    closeActionMenus();
  });

  rows.addEventListener("click", async (event) => {
    const target = event.target;
    if (!(target instanceof Element)) {
      return;
    }

    const actionElement = target.closest("[data-action]");
    if (!(actionElement instanceof HTMLElement)) {
      return;
    }

    const action = actionElement.dataset.action;
    const authorId = actionElement.dataset.authorId?.trim() ?? "";
    if (!authorId) {
      return;
    }

    if (action === "toggle-actions-menu") {
      toggleActionMenu(authorId);
      return;
    }

    if (action === "edit-author") {
      const author = authorIndex.get(authorId);
      if (!author) {
        setError(feedback, "No se encontro el autor seleccionado.");
        return;
      }
      closeActionMenus();
      clearFeedback(feedback);
      enterEditMode(author);
      setMessage(feedback, `Editando autor: ${author.name}`);
      return;
    }

    if (action === "toggle-author-active" && actionElement instanceof HTMLButtonElement) {
      const isActive = actionElement.dataset.active === "true";
      actionElement.disabled = true;
      clearFeedback(feedback);
      try {
        await toggleAuthorActive(authorId, !isActive);
        closeActionMenus();
        await load();
      } catch (toggleError) {
        const messageText = toggleError instanceof Error ? toggleError.message : "Error actualizando autor";
        setError(feedback, messageText);
      } finally {
        actionElement.disabled = false;
      }
      return;
    }

    if (action === "delete-author" && actionElement instanceof HTMLButtonElement) {
      const authorName = actionElement.dataset.authorName?.trim() ?? "";
      const confirmed = window.confirm(
        `Esta accion eliminara el autor${authorName ? ` '${authorName}'` : ""}. Deseas continuar?`,
      );
      if (!confirmed) {
        closeActionMenus();
        return;
      }

      const previousText = actionElement.textContent;
      actionElement.disabled = true;
      actionElement.textContent = "Eliminando...";
      clearFeedback(feedback);
      setMessage(feedback, "Procesando eliminacion...");

      try {
        await deleteAuthor(authorId);
        if (editingAuthorId === authorId) {
          resetForm();
        }
        closeActionMenus();
        await load();
        setMessage(feedback, "Autor eliminado.");
      } catch (deleteError) {
        const messageText = deleteError instanceof Error ? deleteError.message : "Error eliminando autor";
        setError(feedback, messageText);
      } finally {
        actionElement.disabled = false;
        actionElement.textContent = previousText;
      }
    }
  });

  refreshButton.addEventListener("click", () => {
    void load();
  });

  rows.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeActionMenus();
    }
  });

  document.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof Node)) {
      return;
    }
    if (!rows.contains(target)) {
      closeActionMenus();
    }
  });

  slugInput.addEventListener("input", () => {
    if (editingAuthorId) {
      return;
    }
    const value = slugInput.value.trim().toLowerCase().replace(/\s+/g, "-");
    slugInput.value = value.replace(/[^a-z0-9-]/g, "").replace(/-+/g, "-");
  });

  photoInput.addEventListener("blur", () => {
    const value = normalizeOptionalText(photoInput.value);
    if (value) {
      photoInput.value = value;
    }
  });

  await load();
}
