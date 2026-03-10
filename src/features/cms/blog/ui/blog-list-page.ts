import { deleteBlogPost, listBlogPosts } from "../data/blog-repository";
import type { CmsBlogListItem, CmsBlogStatus } from "../domain/types";

function formatDate(value: string | null): string {
  if (!value) {
    return "Sin fecha";
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(parsed);
}

function statusBadgeClass(status: CmsBlogStatus): string {
  if (status === "published") {
    return "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40";
  }
  if (status === "scheduled") {
    return "bg-amber-500/20 text-amber-300 border border-amber-500/40";
  }
  return "bg-slate-700/50 text-slate-200 border border-slate-600";
}

function closeAllActionMenus(container: HTMLElement): void {
  const menus = Array.from(container.querySelectorAll<HTMLElement>("[data-menu-for]"));
  menus.forEach((menu) => {
    menu.classList.add("hidden");
  });

  const toggleButtons = Array.from(
    container.querySelectorAll<HTMLButtonElement>('[data-action="toggle-actions-menu"]'),
  );
  toggleButtons.forEach((button) => {
    button.setAttribute("aria-expanded", "false");
  });
}

function toggleActionMenu(container: HTMLElement, postId: string): void {
  const menu = container.querySelector(`[data-menu-for="${postId}"]`);
  const toggleButton = container.querySelector(
    `[data-action="toggle-actions-menu"][data-post-id="${postId}"]`,
  );

  if (!(menu instanceof HTMLElement) || !(toggleButton instanceof HTMLButtonElement)) {
    return;
  }

  const isOpen = !menu.classList.contains("hidden");
  closeAllActionMenus(container);

  if (!isOpen) {
    menu.classList.remove("hidden");
    toggleButton.setAttribute("aria-expanded", "true");
    menu.focus();
  }
}

function renderRows(container: HTMLElement, posts: CmsBlogListItem[]): void {
  if (!posts.length) {
    container.innerHTML = `
      <tr>
        <td colspan="6" class="px-4 py-10 text-center text-slate-400">No hay posts para este filtro.</td>
      </tr>
    `;
    return;
  }

  container.innerHTML = posts
    .map(
      (post) => `
        <tr class="border-b border-slate-800 hover:bg-slate-900/60">
          <td class="px-4 py-3">
            <p class="font-medium text-slate-100">${post.h1 ?? "(sin H1)"}</p>
            <p class="text-xs text-slate-400 mt-1">${post.category_slug}/${post.slug}</p>
          </td>
          <td class="px-4 py-3 text-sm text-slate-300">${post.slug}</td>
          <td class="px-4 py-3 text-sm text-slate-300">${post.category_slug}</td>
          <td class="px-4 py-3">
            <span class="inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${statusBadgeClass(post.status)}">
              ${post.status}
            </span>
          </td>
          <td class="px-4 py-3 text-sm text-slate-300">${formatDate(post.publish_date)}</td>
          <td class="px-4 py-3 text-right relative">
            <div class="inline-flex items-center justify-end relative">
              <button
                type="button"
                data-action="toggle-actions-menu"
                data-post-id="${post.id}"
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
                data-menu-for="${post.id}"
                class="hidden absolute right-0 top-10 z-30 min-w-[155px] rounded-xl border border-slate-700/80 bg-slate-900/95 p-1 shadow-2xl backdrop-blur"
              >
                <a
                  href="/cms/blog/${post.id}"
                  role="menuitem"
                  class="block rounded-md px-3 py-2 text-left text-sm text-cyan-300 hover:bg-cyan-500/10"
                >
                  Editar
                </a>
                <button
                  type="button"
                  role="menuitem"
                  data-action="delete-post"
                  data-post-id="${post.id}"
                  data-post-slug="${post.slug}"
                  class="mt-1 block w-full rounded-md px-3 py-2 text-left text-sm text-rose-300 hover:bg-rose-500/10"
                >
                  Eliminar
                </button>
              </div>
            </div>
          </td>
        </tr>
      `,
    )
    .join("");
}

export async function initCmsBlogListPage(): Promise<void> {
  const searchInput = document.getElementById("cms-blog-search");
  const statusSelect = document.getElementById("cms-blog-status-filter");
  const refreshButton = document.getElementById("cms-blog-refresh");
  const rowsContainer = document.getElementById("cms-blog-table-rows");
  const summaryEl = document.getElementById("cms-blog-summary");
  const errorEl = document.getElementById("cms-blog-error");

  if (
    !(searchInput instanceof HTMLInputElement) ||
    !(statusSelect instanceof HTMLSelectElement) ||
    !(refreshButton instanceof HTMLButtonElement) ||
    !(rowsContainer instanceof HTMLElement) ||
    !(summaryEl instanceof HTMLElement) ||
    !(errorEl instanceof HTMLElement)
  ) {
    return;
  }

  const loadRows = async (): Promise<void> => {
    refreshButton.disabled = true;
    errorEl.textContent = "";
    summaryEl.textContent = "Cargando...";

    try {
      const statusValue = statusSelect.value as CmsBlogStatus | "all";
      const searchValue = searchInput.value.trim();
      const posts = await listBlogPosts({
        status: statusValue,
        search: searchValue,
      });
      renderRows(rowsContainer, posts);
      summaryEl.textContent = `${posts.length} post(s) encontrados`;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error al cargar posts";
      rowsContainer.innerHTML = "";
      summaryEl.textContent = "Error al cargar";
      errorEl.textContent = message;
    } finally {
      refreshButton.disabled = false;
    }
  };

  refreshButton.addEventListener("click", () => {
    void loadRows();
  });

  statusSelect.addEventListener("change", () => {
    void loadRows();
  });

  rowsContainer.addEventListener("click", async (event) => {
    const target = event.target;
    if (!(target instanceof Element)) {
      return;
    }

    const actionElement = target.closest("[data-action]");
    if (!(actionElement instanceof HTMLElement)) {
      return;
    }

    const action = actionElement.dataset.action;
    if (action === "toggle-actions-menu") {
      const postId = actionElement.dataset.postId?.trim() ?? "";
      if (!postId) {
        return;
      }
      toggleActionMenu(rowsContainer, postId);
      return;
    }

    if (action !== "delete-post" || !(actionElement instanceof HTMLButtonElement)) {
      return;
    }

    const deleteButton = actionElement;
    const postId = deleteButton.dataset.postId?.trim() ?? "";
    const postSlug = deleteButton.dataset.postSlug?.trim() ?? "";
    if (!postId) {
      return;
    }

    const confirmed = window.confirm(
      `Esta accion eliminara permanentemente la entrada${postSlug ? ` '${postSlug}'` : ""}. Deseas continuar?`,
    );
    if (!confirmed) {
      closeAllActionMenus(rowsContainer);
      return;
    }

    const previousText = deleteButton.textContent;
    deleteButton.disabled = true;
    deleteButton.textContent = "Eliminando...";
    errorEl.textContent = "";
    summaryEl.textContent = "Procesando eliminacion...";

    try {
      await deleteBlogPost(postId, "Delete desde listado CMS");
      closeAllActionMenus(rowsContainer);
      await loadRows();
      summaryEl.textContent = "Entrada eliminada correctamente.";
    } catch (error) {
      const message = error instanceof Error ? error.message : "No se pudo eliminar la entrada";
      errorEl.textContent = message;
      summaryEl.textContent = "Error al eliminar";
    } finally {
      deleteButton.disabled = false;
      deleteButton.textContent = previousText;
    }
  });

  rowsContainer.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeAllActionMenus(rowsContainer);
    }
  });

  document.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof Node)) {
      return;
    }
    if (!rowsContainer.contains(target)) {
      closeAllActionMenus(rowsContainer);
    }
  });

  searchInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      void loadRows();
    }
  });

  await loadRows();
}

