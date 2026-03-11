import {
  buildCanonicalUrl,
  createBlogDraft,
  createBlogPreviewToken,
  deleteBlogPost,
  getBlogPostById,
  listAuthorOptions,
  listCategoryOptions,
  listTagOptions,
  updateBlogPost,
  updateBlogPostStatus,
} from "../data/blog-repository";
import { assertNonEmpty, assertValidSlug, parseJsonObject, parseOptionalIsoDate } from "../domain/validators";
import type { CmsBlogFaqItem, CmsBlogStatus, CmsOption } from "../domain/types";

type EditorMode = "create" | "edit";
type EditorOptions = {
  postId?: string;
};

type EditorElements = {
  slug: HTMLInputElement;
  categoryId: HTMLSelectElement;
  h1: HTMLInputElement;
  metaDescription: HTMLTextAreaElement;
  canonicalUrl: HTMLInputElement;
  shortDescription: HTMLTextAreaElement;
  featuredImageUrl: HTMLInputElement;
  featuredImageAlt: HTMLInputElement;
  authorId: HTMLSelectElement;
  tagIds: HTMLSelectElement;
  tagsToggleButton: HTMLButtonElement;
  tagsDropdown: HTMLElement;
  tagsSearchInput: HTMLInputElement;
  tagsOptions: HTMLElement;
  tagsSelected: HTMLElement;
  tagsEmpty: HTMLElement;
  tagsApplyButton: HTMLButtonElement;
  contentMarkdown: HTMLTextAreaElement;
  schemaAuto: HTMLTextAreaElement;
  schemaOverride: HTMLTextAreaElement;
  faqList: HTMLElement;
  faqAdd: HTMLButtonElement;
  scheduledAt: HTMLInputElement;
  publishDate: HTMLInputElement;
  currentStatus: HTMLElement;
  currentPostId: HTMLElement;
  message: HTMLElement;
  error: HTMLElement;
  saveDraftButton: HTMLButtonElement;
  scheduleButton: HTMLButtonElement;
  publishButton: HTMLButtonElement;
  publishChangesButton: HTMLButtonElement;
  revertButton: HTMLButtonElement;
  deleteButton: HTMLButtonElement | null;
  previewButton: HTMLButtonElement;
  previewLink: HTMLAnchorElement;
  previewMeta: HTMLElement;
  backToListLink: HTMLAnchorElement;
};

function getRequiredElement<T extends HTMLElement>(id: string, elementClass: new () => T): T {
  const element = document.getElementById(id);
  if (!(element instanceof elementClass)) {
    throw new Error(`Elemento requerido no encontrado: ${id}`);
  }
  return element;
}

function collectElements(): EditorElements {
  const deleteButtonElement = document.getElementById("cms-blog-delete");
  return {
    slug: getRequiredElement("cms-blog-slug", HTMLInputElement),
    categoryId: getRequiredElement("cms-blog-category-id", HTMLSelectElement),
    h1: getRequiredElement("cms-blog-h1", HTMLInputElement),
    metaDescription: getRequiredElement("cms-blog-meta-description", HTMLTextAreaElement),
    canonicalUrl: getRequiredElement("cms-blog-canonical-url", HTMLInputElement),
    shortDescription: getRequiredElement("cms-blog-short-description", HTMLTextAreaElement),
    featuredImageUrl: getRequiredElement("cms-blog-featured-image-url", HTMLInputElement),
    featuredImageAlt: getRequiredElement("cms-blog-featured-image-alt", HTMLInputElement),
    authorId: getRequiredElement("cms-blog-author-id", HTMLSelectElement),
    tagIds: getRequiredElement("cms-blog-tag-ids", HTMLSelectElement),
    tagsToggleButton: getRequiredElement("cms-blog-tags-toggle", HTMLButtonElement),
    tagsDropdown: getRequiredElement("cms-blog-tags-dropdown", HTMLElement),
    tagsSearchInput: getRequiredElement("cms-blog-tags-search", HTMLInputElement),
    tagsOptions: getRequiredElement("cms-blog-tags-options", HTMLElement),
    tagsSelected: getRequiredElement("cms-blog-tags-selected", HTMLElement),
    tagsEmpty: getRequiredElement("cms-blog-tags-empty", HTMLElement),
    tagsApplyButton: getRequiredElement("cms-blog-tags-apply", HTMLButtonElement),
    contentMarkdown: getRequiredElement("cms-blog-content-markdown", HTMLTextAreaElement),
    schemaAuto: getRequiredElement("cms-blog-schema-auto", HTMLTextAreaElement),
    schemaOverride: getRequiredElement("cms-blog-schema-override", HTMLTextAreaElement),
    faqList: getRequiredElement("cms-blog-faq-list", HTMLElement),
    faqAdd: getRequiredElement("cms-blog-faq-add", HTMLButtonElement),
    scheduledAt: getRequiredElement("cms-blog-scheduled-at", HTMLInputElement),
    publishDate: getRequiredElement("cms-blog-publish-date", HTMLInputElement),
    currentStatus: getRequiredElement("cms-blog-current-status", HTMLElement),
    currentPostId: getRequiredElement("cms-blog-current-post-id", HTMLElement),
    message: getRequiredElement("cms-blog-message", HTMLElement),
    error: getRequiredElement("cms-blog-error", HTMLElement),
    saveDraftButton: getRequiredElement("cms-blog-save-draft", HTMLButtonElement),
    scheduleButton: getRequiredElement("cms-blog-schedule", HTMLButtonElement),
    publishButton: getRequiredElement("cms-blog-publish", HTMLButtonElement),
    publishChangesButton: getRequiredElement("cms-blog-publish-changes", HTMLButtonElement),
    revertButton: getRequiredElement("cms-blog-revert", HTMLButtonElement),
    deleteButton: deleteButtonElement instanceof HTMLButtonElement ? deleteButtonElement : null,
    previewButton: getRequiredElement("cms-blog-preview-generate", HTMLButtonElement),
    previewLink: getRequiredElement("cms-blog-preview-link", HTMLAnchorElement),
    previewMeta: getRequiredElement("cms-blog-preview-meta", HTMLElement),
    backToListLink: getRequiredElement("cms-blog-back-link", HTMLAnchorElement),
  };
}

function setInfo(elements: EditorElements, message: string): void {
  elements.message.textContent = message;
  elements.error.textContent = "";
}

function setError(elements: EditorElements, message: string): void {
  elements.error.textContent = message;
  if (!elements.message.textContent?.trim()) {
    elements.message.textContent = "";
  }
}

function clearMessages(elements: EditorElements): void {
  elements.error.textContent = "";
  elements.message.textContent = "";
}

function fillSelectOptions(select: HTMLSelectElement, options: CmsOption[], placeholder: string, allowEmpty = false): void {
  const headOption = allowEmpty ? `<option value="">${placeholder}</option>` : "";
  select.innerHTML =
    headOption +
    options
      .map((option) => `<option value="${option.id}" data-slug="${option.slug}">${option.name} (${option.slug})</option>`)
      .join("");
}

function createFaqRow(question = "", answer = "", position?: number): HTMLElement {
  const wrapper = document.createElement("div");
  wrapper.className = "cms-faq-row rounded-lg border border-slate-800 bg-slate-900/70 p-3 space-y-2";
  if (typeof position === "number") {
    wrapper.dataset.position = String(position);
  }

  wrapper.innerHTML = `
    <div class="flex items-center justify-between gap-2">
      <p class="text-xs uppercase tracking-wide text-slate-400">FAQ</p>
      <button type="button" class="cms-faq-remove rounded-md border border-rose-500/60 px-2 py-1 text-xs text-rose-300 hover:bg-rose-500/10">
        Eliminar
      </button>
    </div>
    <label class="block text-sm">
      <span class="text-slate-300">Pregunta</span>
      <input type="text" class="cms-faq-question mt-1 w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100" />
    </label>
    <label class="block text-sm">
      <span class="text-slate-300">Respuesta</span>
      <textarea class="cms-faq-answer mt-1 w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100" rows="3"></textarea>
    </label>
  `;

  const questionInput = wrapper.querySelector(".cms-faq-question");
  const answerInput = wrapper.querySelector(".cms-faq-answer");
  const removeButton = wrapper.querySelector(".cms-faq-remove");

  if (questionInput instanceof HTMLInputElement) {
    questionInput.value = question;
  }
  if (answerInput instanceof HTMLTextAreaElement) {
    answerInput.value = answer;
  }
  if (removeButton instanceof HTMLButtonElement) {
    removeButton.addEventListener("click", () => wrapper.remove());
  }

  return wrapper;
}

function readFaqs(elements: EditorElements): CmsBlogFaqItem[] {
  const rows = Array.from(elements.faqList.querySelectorAll(".cms-faq-row"));
  const parsedRows = rows
    .map((row, index) => {
      const questionInput = row.querySelector(".cms-faq-question");
      const answerInput = row.querySelector(".cms-faq-answer");
      if (!(questionInput instanceof HTMLInputElement) || !(answerInput instanceof HTMLTextAreaElement)) {
        return null;
      }
      const question = questionInput.value.trim();
      const answer = answerInput.value.trim();
      if (!question && !answer) {
        return null;
      }
      if (!question || !answer) {
        throw new Error("Cada FAQ debe tener pregunta y respuesta.");
      }
      return {
        question,
        answer,
        position: index,
      };
    })
    .filter(Boolean) as CmsBlogFaqItem[];

  return parsedRows;
}

function setTagSelectOptions(select: HTMLSelectElement, options: CmsOption[]): void {
  select.innerHTML = "";
  for (const option of options) {
    const item = document.createElement("option");
    item.value = option.id;
    item.dataset.slug = option.slug;
    item.textContent = `${option.name} (${option.slug})`;
    select.appendChild(item);
  }
}

function syncTagSelectWithSelectedIds(
  select: HTMLSelectElement,
  selectedTagIds: Set<string>,
  availableTagsById: Map<string, CmsOption>,
): void {
  const existingValues = new Set(Array.from(select.options).map((option) => option.value));
  for (const tagId of selectedTagIds) {
    if (!existingValues.has(tagId)) {
      const option = document.createElement("option");
      option.value = tagId;
      option.textContent = `${tagId} (sin catalogo activo)`;
      select.appendChild(option);
      existingValues.add(tagId);
    }
  }

  Array.from(select.options).forEach((option) => {
    option.selected = selectedTagIds.has(option.value);
    if (!availableTagsById.has(option.value) && !selectedTagIds.has(option.value)) {
      option.remove();
    }
  });
}

function getTagLabel(tagId: string, availableTagsById: Map<string, CmsOption>): string {
  const tag = availableTagsById.get(tagId);
  if (!tag) {
    return `${tagId} (sin catalogo activo)`;
  }
  return `${tag.name} (${tag.slug})`;
}

function renderTagSelectionSummary(
  elements: EditorElements,
  selectedTagIds: Set<string>,
  availableTagsById: Map<string, CmsOption>,
): void {
  elements.tagsSelected.innerHTML = "";
  if (!selectedTagIds.size) {
    elements.tagsEmpty.classList.remove("hidden");
  } else {
    elements.tagsEmpty.classList.add("hidden");
  }

  for (const tagId of selectedTagIds) {
    const chip = document.createElement("span");
    chip.className = "inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-xs";
    chip.textContent = getTagLabel(tagId, availableTagsById);

    const removeButton = document.createElement("button");
    removeButton.type = "button";
    removeButton.dataset.tagRemoveId = tagId;
    removeButton.className =
      "rounded-full border border-slate-700 px-1.5 py-0.5 text-[10px] text-slate-300 hover:bg-slate-800";
    removeButton.textContent = "Quitar";
    chip.appendChild(removeButton);
    elements.tagsSelected.appendChild(chip);
  }

  elements.tagsToggleButton.textContent = selectedTagIds.size
    ? `Seleccionar tags (${selectedTagIds.size})`
    : "Seleccionar tags";
}

function renderTagDropdownOptions(
  elements: EditorElements,
  options: CmsOption[],
  selectedTagIds: Set<string>,
  searchTerm: string,
): void {
  const normalizedSearch = searchTerm.trim().toLowerCase();
  const filtered = normalizedSearch
    ? options.filter((option) => {
        const haystack = `${option.name} ${option.slug}`.toLowerCase();
        return haystack.includes(normalizedSearch);
      })
    : options;

  elements.tagsOptions.innerHTML = "";
  if (!filtered.length) {
    const empty = document.createElement("p");
    empty.className = "text-xs text-slate-400";
    empty.textContent = "No hay tags para la busqueda actual.";
    elements.tagsOptions.appendChild(empty);
    return;
  }

  const fragment = document.createDocumentFragment();
  for (const option of filtered) {
    const label = document.createElement("label");
    label.className = "flex cursor-pointer items-center gap-2 rounded-md px-2 py-1 text-sm hover:bg-slate-800";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.value = option.id;
    checkbox.dataset.tagId = option.id;
    checkbox.checked = selectedTagIds.has(option.id);
    checkbox.className = "h-4 w-4";

    const text = document.createElement("span");
    text.textContent = `${option.name} (${option.slug})`;

    label.appendChild(checkbox);
    label.appendChild(text);
    fragment.appendChild(label);
  }

  elements.tagsOptions.appendChild(fragment);
}

function setTagsDropdownOpen(elements: EditorElements, isOpen: boolean): void {
  elements.tagsDropdown.classList.toggle("hidden", !isOpen);
  elements.tagsToggleButton.setAttribute("aria-expanded", isOpen ? "true" : "false");
}

function getCategorySlugFromSelection(categorySelect: HTMLSelectElement): string | null {
  const selected = categorySelect.selectedOptions[0];
  if (!selected) {
    return null;
  }
  return selected.dataset.slug ?? null;
}

function getFormCanonical(elements: EditorElements): string | null {
  const canonical = elements.canonicalUrl.value.trim();
  if (canonical) {
    return canonical;
  }
  const categorySlug = getCategorySlugFromSelection(elements.categoryId);
  const slug = elements.slug.value.trim();
  if (!categorySlug || !slug) {
    return null;
  }
  return buildCanonicalUrl(categorySlug, slug);
}

function readFeaturedImage(elements: EditorElements):
  | { url: string; alt: string; metadata?: Record<string, unknown> }
  | null {
  const url = elements.featuredImageUrl.value.trim();
  const alt = elements.featuredImageAlt.value.trim();
  if (!url && !alt) {
    return null;
  }
  if (!url || !alt) {
    throw new Error("Imagen destacada requiere URL y ALT.");
  }
  return {
    url,
    alt,
  };
}

function setElementVisibility(element: HTMLElement | null, visible: boolean): void {
  if (!element) {
    return;
  }
  element.classList.toggle("hidden", !visible);
}

function updateEditorialActionVisibility(
  elements: EditorElements,
  status: CmsBlogStatus | "new",
  hasPersistedPost: boolean,
): void {
  if (!hasPersistedPost || status === "new") {
    setElementVisibility(elements.saveDraftButton, true);
    setElementVisibility(elements.scheduleButton, false);
    setElementVisibility(elements.publishButton, false);
    setElementVisibility(elements.publishChangesButton, false);
    setElementVisibility(elements.revertButton, false);
    setElementVisibility(elements.previewButton, false);
    setElementVisibility(elements.tagsApplyButton, false);
    setElementVisibility(elements.deleteButton, false);
    return;
  }

  const isDraft = status === "draft";
  const isScheduled = status === "scheduled";
  const isPublished = status === "published";

  setElementVisibility(elements.saveDraftButton, isDraft || isScheduled);
  setElementVisibility(elements.scheduleButton, isDraft);
  setElementVisibility(elements.publishButton, isDraft || isScheduled);
  setElementVisibility(elements.publishChangesButton, isPublished);
  setElementVisibility(elements.revertButton, isPublished);
  setElementVisibility(elements.previewButton, isDraft || isScheduled);
  setElementVisibility(elements.tagsApplyButton, true);
  setElementVisibility(elements.deleteButton, true);
}

function setButtonsDisabled(elements: EditorElements, disabled: boolean): void {
  elements.saveDraftButton.disabled = disabled;
  elements.scheduleButton.disabled = disabled;
  elements.publishButton.disabled = disabled;
  elements.publishChangesButton.disabled = disabled;
  elements.revertButton.disabled = disabled;
  elements.tagsApplyButton.disabled = disabled;
  if (elements.deleteButton) {
    elements.deleteButton.disabled = disabled;
  }
  elements.previewButton.disabled = disabled;
}

function setCurrentStatus(elements: EditorElements, status: CmsBlogStatus | "new"): void {
  elements.currentStatus.textContent = status;
}

function setCurrentPostId(elements: EditorElements, postId: string | null): void {
  elements.currentPostId.textContent = postId ?? "(sin ID)";
}

function navigateTo(url: string): void {
  if (typeof navigator !== "undefined" && /jsdom/i.test(navigator.userAgent)) {
    return;
  }
  try {
    window.location.assign(url);
  } catch {
    // JSDOM no implementa navegacion completa y lanza excepcion en tests.
  }
}

function updateCanonicalPreviewOnInputs(elements: EditorElements): void {
  const maybeCanonical = getFormCanonical(elements);
  if (maybeCanonical && !elements.canonicalUrl.value.trim()) {
    elements.canonicalUrl.placeholder = maybeCanonical;
  } else if (!maybeCanonical) {
    elements.canonicalUrl.placeholder = "https://creamvp.com/blog/[categoria]/[slug]";
  }
}

type BlogFormSnapshot = {
  slug: string;
  categoryId: string;
  h1: string | null;
  metaDescription: string | null;
  canonicalUrl: string | null;
  shortDescription: string | null;
  featuredImage: { url: string; alt: string; metadata?: Record<string, unknown> } | null;
  authorId: string | null;
  contentMarkdown: string | null;
  schemaOverride: Record<string, unknown> | null;
  tags: string[];
  faqs: CmsBlogFaqItem[];
};

function readBlogFormSnapshot(elements: EditorElements, selectedTagIds: Set<string>): BlogFormSnapshot {
  const slug = elements.slug.value.trim();
  assertNonEmpty(slug, "slug");
  assertValidSlug(slug);

  const categoryId = elements.categoryId.value.trim();
  assertNonEmpty(categoryId, "categoria");

  const canonicalUrl = getFormCanonical(elements);
  const featuredImage = readFeaturedImage(elements);
  const schemaOverride = parseJsonObject(elements.schemaOverride.value, "schemaOverride");
  const faqs = readFaqs(elements);
  const tags = Array.from(selectedTagIds);
  const authorId = elements.authorId.value.trim() || null;

  return {
    slug,
    categoryId,
    h1: elements.h1.value.trim() || null,
    metaDescription: elements.metaDescription.value.trim() || null,
    canonicalUrl,
    shortDescription: elements.shortDescription.value.trim() || null,
    featuredImage,
    authorId,
    contentMarkdown: elements.contentMarkdown.value.trim() || null,
    schemaOverride,
    tags,
    faqs,
  };
}

function resolvePostIdFromPathname(pathname: string): string | null {
  const normalized = pathname.replace(/\/+$/, "");
  const match = normalized.match(/^\/cms\/blog\/([^/]+)$/);
  if (!match?.[1]) {
    return null;
  }
  return decodeURIComponent(match[1]);
}

function formatDateText(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(parsed);
}

function syncPublishDateInput(elements: EditorElements, value: string | null | undefined): void {
  if (!value) {
    return;
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return;
  }
  elements.publishDate.value = parsed.toISOString().slice(0, 16);
}

export async function initCmsBlogEditorPage(initialMode: EditorMode, options: EditorOptions = {}): Promise<void> {
  const elements = collectElements();
  const mode = initialMode;
  let postId: string | null = null;
  let currentEditorStatus: CmsBlogStatus | "new" = "new";
  let tagsDropdownOpen = false;
  let tagsSearchTerm = "";
  const selectedTagIds = new Set<string>();
  let availableTags: CmsOption[] = [];
  let availableTagsById = new Map<string, CmsOption>();

  const syncEditorialActions = (): void => {
    updateEditorialActionVisibility(elements, currentEditorStatus, Boolean(postId));
  };

  const setEditorStatus = (status: CmsBlogStatus | "new"): void => {
    currentEditorStatus = status;
    setCurrentStatus(elements, status);
    syncEditorialActions();
  };

  try {
    clearMessages(elements);
    setInfo(elements, "Cargando catalogos...");
    syncEditorialActions();

    const [categories, authors, tags] = await Promise.all([
      listCategoryOptions(),
      listAuthorOptions(),
      listTagOptions(),
    ]);

    fillSelectOptions(elements.categoryId, categories, "Selecciona categoria");
    fillSelectOptions(elements.authorId, authors, "Sin autor", true);
    availableTags = tags;
    availableTagsById = new Map(tags.map((tag) => [tag.id, tag]));
    setTagSelectOptions(elements.tagIds, availableTags);

    const syncTagsUi = (): void => {
      syncTagSelectWithSelectedIds(elements.tagIds, selectedTagIds, availableTagsById);
      renderTagDropdownOptions(elements, availableTags, selectedTagIds, tagsSearchTerm);
      renderTagSelectionSummary(elements, selectedTagIds, availableTagsById);
    };

    const searchParams = new URLSearchParams(window.location.search);
    const postIdFromQuery = searchParams.get("id");
    const postIdFromPath = resolvePostIdFromPathname(window.location.pathname);
    const postIdFromOptions = options.postId?.trim() ?? "";
    const postIdFromUrl = postIdFromOptions || postIdFromPath || postIdFromQuery;

    if (mode === "edit" && !postIdFromUrl) {
      setError(elements, "No se detecto id de post. Usa /cms/blog/<id>.");
      setInfo(elements, "");
      setButtonsDisabled(elements, true);
      syncEditorialActions();
      return;
    }

    if (mode === "edit" && postIdFromUrl) {
      setInfo(elements, "Cargando entrada...");
      const post = await getBlogPostById(postIdFromUrl);
      if (!post) {
        throw new Error("No se encontro el post solicitado.");
      }

      postId = post.id;
      setCurrentPostId(elements, post.id);
      setEditorStatus(post.status);

      elements.slug.value = post.slug;
      elements.categoryId.value = post.category_id;
      elements.h1.value = post.h1 ?? "";
      elements.metaDescription.value = post.meta_description ?? "";
      elements.canonicalUrl.value = post.canonical_url ?? "";
      elements.shortDescription.value = post.short_description ?? "";
      elements.featuredImageUrl.value = post.featured_image_url ?? "";
      elements.featuredImageAlt.value = post.featured_image_alt ?? "";
      elements.authorId.value = post.author_id ?? "";
      elements.contentMarkdown.value = post.content_markdown ?? "";
      elements.schemaAuto.value = post.schema_auto ? JSON.stringify(post.schema_auto, null, 2) : "";
      elements.schemaOverride.value = post.schema_override ? JSON.stringify(post.schema_override, null, 2) : "";
      selectedTagIds.clear();
      for (const tagId of post.tags) {
        selectedTagIds.add(tagId);
      }
      elements.faqList.innerHTML = "";
      if (!post.faqs.length) {
        elements.faqList.appendChild(createFaqRow());
      } else {
        post.faqs.forEach((faq) => {
          elements.faqList.appendChild(createFaqRow(faq.question, faq.answer, faq.position));
        });
      }
      if (post.scheduled_publish_at) {
        const scheduled = new Date(post.scheduled_publish_at);
        if (!Number.isNaN(scheduled.getTime())) {
          elements.scheduledAt.value = scheduled.toISOString().slice(0, 16);
        }
      }
      if (post.publish_date) {
        const publishDate = new Date(post.publish_date);
        if (!Number.isNaN(publishDate.getTime())) {
          elements.publishDate.value = publishDate.toISOString().slice(0, 16);
        }
      }
    } else {
      setCurrentPostId(elements, null);
      setEditorStatus("new");
      elements.scheduledAt.value = "";
      elements.publishDate.value = "";
      elements.faqList.innerHTML = "";
      elements.faqList.appendChild(createFaqRow());
      setInfo(elements, "Completa campos y guarda como draft.");
    }

    syncTagsUi();
    setTagsDropdownOpen(elements, false);
    updateCanonicalPreviewOnInputs(elements);
    elements.slug.addEventListener("input", () => updateCanonicalPreviewOnInputs(elements));
    elements.categoryId.addEventListener("change", () => updateCanonicalPreviewOnInputs(elements));

    elements.faqAdd.addEventListener("click", () => {
      elements.faqList.appendChild(createFaqRow());
    });

    elements.tagsToggleButton.addEventListener("click", (event) => {
      event.preventDefault();
      tagsDropdownOpen = !tagsDropdownOpen;
      setTagsDropdownOpen(elements, tagsDropdownOpen);
      if (tagsDropdownOpen) {
        elements.tagsSearchInput.focus();
      }
    });

    elements.tagsSearchInput.addEventListener("input", () => {
      tagsSearchTerm = elements.tagsSearchInput.value;
      syncTagsUi();
    });

    elements.tagsOptions.addEventListener("change", (event) => {
      const target = event.target;
      if (!(target instanceof HTMLInputElement) || target.type !== "checkbox") {
        return;
      }
      const tagId = target.dataset.tagId;
      if (!tagId) {
        return;
      }
      if (target.checked) {
        selectedTagIds.add(tagId);
      } else {
        selectedTagIds.delete(tagId);
      }
      syncTagsUi();
    });

    elements.tagsSelected.addEventListener("click", (event) => {
      const target = event.target;
      if (!(target instanceof Element)) {
        return;
      }
      const removeButton = target.closest("button[data-tag-remove-id]");
      if (!(removeButton instanceof HTMLButtonElement)) {
        return;
      }
      const tagId = removeButton.dataset.tagRemoveId;
      if (!tagId) {
        return;
      }
      selectedTagIds.delete(tagId);
      syncTagsUi();
    });

    document.addEventListener("click", (event) => {
      if (!tagsDropdownOpen) {
        return;
      }
      const target = event.target;
      if (!(target instanceof Node)) {
        return;
      }
      if (elements.tagsDropdown.contains(target) || elements.tagsToggleButton.contains(target)) {
        return;
      }
      tagsDropdownOpen = false;
      setTagsDropdownOpen(elements, false);
    });

    elements.tagsApplyButton.addEventListener("click", async () => {
      if (!postId) {
        setError(elements, "Primero guarda el draft para obtener ID y luego actualizar tags.");
        return;
      }

      clearMessages(elements);
      elements.tagsApplyButton.disabled = true;
      setInfo(elements, "Actualizando tags...");

      try {
        const slug = elements.slug.value.trim();
        assertNonEmpty(slug, "slug");
        assertValidSlug(slug);

        const updated = await updateBlogPost({
          postId,
          patch: {
            slug,
          },
          tags: Array.from(selectedTagIds),
        });
        setEditorStatus(updated.status);
        setInfo(elements, "Tags actualizados correctamente.");
      } catch (error) {
        const message = error instanceof Error ? error.message : "Error al actualizar tags";
        setError(elements, message);
      } finally {
        elements.tagsApplyButton.disabled = false;
      }
    });

    elements.backToListLink.href = "/cms/blog";

    elements.saveDraftButton.addEventListener("click", async () => {
      clearMessages(elements);
      setButtonsDisabled(elements, true);
      setInfo(elements, "Guardando draft...");

      try {
        if (postId && currentEditorStatus === "published") {
          throw new Error("Para contenido publicado usa 'Publicar cambios' o 'Revert to Draft'.");
        }

        const snapshot = readBlogFormSnapshot(elements, selectedTagIds);

        if (mode === "create" || !postId) {
          const created = await createBlogDraft({
            slug: snapshot.slug,
            categoryId: snapshot.categoryId,
            h1: snapshot.h1,
            metaDescription: snapshot.metaDescription,
            canonicalUrl: snapshot.canonicalUrl,
            shortDescription: snapshot.shortDescription,
            featuredImage: snapshot.featuredImage,
            authorId: snapshot.authorId,
            contentMarkdown: snapshot.contentMarkdown,
            schemaOverride: snapshot.schemaOverride,
            tags: snapshot.tags,
            faqs: snapshot.faqs,
          });

          setInfo(elements, "Draft creado. Redirigiendo al editor...");
          navigateTo(`/cms/blog/${created.id}`);
          return;
        }

        const updated = await updateBlogPost({
          postId,
          patch: {
            slug: snapshot.slug,
            categoryId: snapshot.categoryId,
            h1: snapshot.h1,
            metaDescription: snapshot.metaDescription,
            canonicalUrl: snapshot.canonicalUrl,
            shortDescription: snapshot.shortDescription,
            featuredImage: snapshot.featuredImage,
            authorId: snapshot.authorId,
            contentMarkdown: snapshot.contentMarkdown,
            schemaOverride: snapshot.schemaOverride,
          },
          tags: snapshot.tags,
          faqs: snapshot.faqs,
        });

        setEditorStatus(updated.status);
        setInfo(elements, "Cambios guardados como draft/scheduled.");
      } catch (error) {
        const message = error instanceof Error ? error.message : "Error al guardar";
        setError(elements, message);
      } finally {
        setButtonsDisabled(elements, false);
      }
    });

    elements.scheduleButton.addEventListener("click", async () => {
      if (!postId) {
        setError(elements, "Primero guarda el draft para obtener ID.");
        return;
      }
      if (currentEditorStatus !== "draft") {
        setError(elements, "Solo puedes programar entradas en estado draft.");
        return;
      }
      clearMessages(elements);
      setButtonsDisabled(elements, true);
      setInfo(elements, "Programando publicacion...");
      try {
        const scheduledPublishAt = parseOptionalIsoDate(elements.scheduledAt.value);
        if (!scheduledPublishAt) {
          throw new Error("Define fecha/hora de programacion antes de continuar.");
        }
        const updated = await updateBlogPostStatus({
          postId,
          status: "scheduled",
          scheduledPublishAt,
          changeReason: "Programado desde CMS UI",
        });
        setEditorStatus(updated.status);
        setInfo(elements, "Post programado correctamente.");
      } catch (error) {
        const message = error instanceof Error ? error.message : "Error al programar";
        setError(elements, message);
      } finally {
        setButtonsDisabled(elements, false);
      }
    });

    elements.publishButton.addEventListener("click", async () => {
      if (!postId) {
        setError(elements, "Primero guarda el draft para obtener ID.");
        return;
      }
      if (!(currentEditorStatus === "draft" || currentEditorStatus === "scheduled")) {
        setError(elements, "Publish solo esta disponible para estados draft o scheduled.");
        return;
      }
      clearMessages(elements);
      setButtonsDisabled(elements, true);
      setInfo(elements, "Publicando post...");
      try {
        const updated = await updateBlogPostStatus({
          postId,
          status: "published",
          publishDate: parseOptionalIsoDate(elements.publishDate.value),
          changeReason: "Publicacion desde CMS UI",
        });
        setEditorStatus(updated.status);
        syncPublishDateInput(elements, updated.publish_date);
        setInfo(elements, "Post publicado.");
      } catch (error) {
        const message = error instanceof Error ? error.message : "Error al publicar";
        setError(elements, message);
      } finally {
        setButtonsDisabled(elements, false);
      }
    });

    elements.publishChangesButton.addEventListener("click", async () => {
      if (!postId) {
        setError(elements, "Primero guarda el draft para obtener ID.");
        return;
      }
      if (currentEditorStatus !== "published") {
        setError(elements, "Publicar cambios solo aplica en estado published.");
        return;
      }

      clearMessages(elements);
      setButtonsDisabled(elements, true);
      setInfo(elements, "Publicando cambios...");

      try {
        const snapshot = readBlogFormSnapshot(elements, selectedTagIds);
        const publishDate = parseOptionalIsoDate(elements.publishDate.value);

        const reverted = await updateBlogPostStatus({
          postId,
          status: "draft",
          changeReason: "Revert temporal para publicar cambios",
        });
        setEditorStatus(reverted.status);

        const updated = await updateBlogPost({
          postId,
          patch: {
            slug: snapshot.slug,
            categoryId: snapshot.categoryId,
            h1: snapshot.h1,
            metaDescription: snapshot.metaDescription,
            canonicalUrl: snapshot.canonicalUrl,
            shortDescription: snapshot.shortDescription,
            featuredImage: snapshot.featuredImage,
            authorId: snapshot.authorId,
            contentMarkdown: snapshot.contentMarkdown,
            schemaOverride: snapshot.schemaOverride,
          },
          tags: snapshot.tags,
          faqs: snapshot.faqs,
        });
        setEditorStatus(updated.status);

        const republished = await updateBlogPostStatus({
          postId,
          status: "published",
          publishDate,
          changeReason: "Publicar cambios desde CMS UI",
        });
        setEditorStatus(republished.status);
        syncPublishDateInput(elements, republished.publish_date);
        setInfo(elements, "Cambios publicados correctamente.");
      } catch (error) {
        const message = error instanceof Error ? error.message : "Error al publicar cambios";
        setError(elements, message);
      } finally {
        setButtonsDisabled(elements, false);
      }
    });

    elements.revertButton.addEventListener("click", async () => {
      if (!postId) {
        setError(elements, "Primero guarda el draft para obtener ID.");
        return;
      }
      if (currentEditorStatus !== "published") {
        setError(elements, "Revert to Draft solo aplica a contenido publicado.");
        return;
      }
      clearMessages(elements);
      setButtonsDisabled(elements, true);
      setInfo(elements, "Regresando a draft...");
      try {
        const updated = await updateBlogPostStatus({
          postId,
          status: "draft",
          changeReason: "Revertido desde CMS UI",
        });
        setEditorStatus(updated.status);
        setInfo(elements, "Post regresado a draft.");
      } catch (error) {
        const message = error instanceof Error ? error.message : "Error al regresar a draft";
        setError(elements, message);
      } finally {
        setButtonsDisabled(elements, false);
      }
    });

    elements.deleteButton?.addEventListener("click", async () => {
      if (!postId) {
        setError(elements, "No hay ID de post para eliminar.");
        return;
      }

      const shouldDelete = window.confirm(
        "Esta accion eliminara permanentemente la entrada y su metadata asociada. Deseas continuar?",
      );
      if (!shouldDelete) {
        return;
      }

      clearMessages(elements);
      setButtonsDisabled(elements, true);
      setInfo(elements, "Eliminando entrada...");

      try {
        await deleteBlogPost(postId, "Delete desde editor CMS");
        setInfo(elements, "Entrada eliminada. Redirigiendo al listado...");
        navigateTo("/cms/blog");
      } catch (error) {
        const message = error instanceof Error ? error.message : "Error al eliminar entrada";
        setError(elements, message);
        setButtonsDisabled(elements, false);
      }
    });

    elements.previewButton.addEventListener("click", async () => {
      if (!postId) {
        setError(elements, "Primero guarda el draft para generar preview.");
        return;
      }

      clearMessages(elements);
      elements.previewButton.disabled = true;
      setInfo(elements, "Generando token de preview...");
      try {
        const previewData = await createBlogPreviewToken(postId);
        elements.previewLink.href = previewData.previewUrl;
        elements.previewLink.classList.remove("hidden");
        elements.previewMeta.textContent = `Preview expira: ${formatDateText(previewData.expiresAt)}`;
        setInfo(elements, "Preview generado.");
      } catch (error) {
        const message = error instanceof Error ? error.message : "No se pudo generar preview.";
        setError(elements, message);
      } finally {
        elements.previewButton.disabled = false;
      }
    });

    setButtonsDisabled(elements, false);
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo inicializar el editor.";
    setButtonsDisabled(elements, true);
    setError(elements, message);
  }
}

