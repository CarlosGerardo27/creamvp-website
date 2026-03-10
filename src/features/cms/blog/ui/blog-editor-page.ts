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
  contentMarkdown: HTMLTextAreaElement;
  schemaAuto: HTMLTextAreaElement;
  schemaOverride: HTMLTextAreaElement;
  faqList: HTMLElement;
  faqAdd: HTMLButtonElement;
  scheduledAt: HTMLInputElement;
  currentStatus: HTMLElement;
  currentPostId: HTMLElement;
  message: HTMLElement;
  error: HTMLElement;
  saveDraftButton: HTMLButtonElement;
  scheduleButton: HTMLButtonElement;
  publishButton: HTMLButtonElement;
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
    contentMarkdown: getRequiredElement("cms-blog-content-markdown", HTMLTextAreaElement),
    schemaAuto: getRequiredElement("cms-blog-schema-auto", HTMLTextAreaElement),
    schemaOverride: getRequiredElement("cms-blog-schema-override", HTMLTextAreaElement),
    faqList: getRequiredElement("cms-blog-faq-list", HTMLElement),
    faqAdd: getRequiredElement("cms-blog-faq-add", HTMLButtonElement),
    scheduledAt: getRequiredElement("cms-blog-scheduled-at", HTMLInputElement),
    currentStatus: getRequiredElement("cms-blog-current-status", HTMLElement),
    currentPostId: getRequiredElement("cms-blog-current-post-id", HTMLElement),
    message: getRequiredElement("cms-blog-message", HTMLElement),
    error: getRequiredElement("cms-blog-error", HTMLElement),
    saveDraftButton: getRequiredElement("cms-blog-save-draft", HTMLButtonElement),
    scheduleButton: getRequiredElement("cms-blog-schedule", HTMLButtonElement),
    publishButton: getRequiredElement("cms-blog-publish", HTMLButtonElement),
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

function readSelectedIds(select: HTMLSelectElement): string[] {
  return Array.from(select.selectedOptions).map((option) => option.value);
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

function setButtonsDisabled(elements: EditorElements, disabled: boolean): void {
  elements.saveDraftButton.disabled = disabled;
  elements.scheduleButton.disabled = disabled;
  elements.publishButton.disabled = disabled;
  elements.revertButton.disabled = disabled;
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

function fillMultiSelect(select: HTMLSelectElement, selectedIds: string[]): void {
  const selectedSet = new Set(selectedIds);
  Array.from(select.options).forEach((option) => {
    option.selected = selectedSet.has(option.value);
  });
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

export async function initCmsBlogEditorPage(initialMode: EditorMode, options: EditorOptions = {}): Promise<void> {
  const elements = collectElements();
  const mode = initialMode;
  let postId: string | null = null;

  try {
    clearMessages(elements);
    setInfo(elements, "Cargando catalogos...");

    const [categories, authors, tags] = await Promise.all([
      listCategoryOptions(),
      listAuthorOptions(),
      listTagOptions(),
    ]);

    fillSelectOptions(elements.categoryId, categories, "Selecciona categoria");
    fillSelectOptions(elements.authorId, authors, "Sin autor", true);
    elements.tagIds.innerHTML = tags
      .map((tag) => `<option value="${tag.id}" data-slug="${tag.slug}">${tag.name} (${tag.slug})</option>`)
      .join("");

    const searchParams = new URLSearchParams(window.location.search);
    const postIdFromQuery = searchParams.get("id");
    const postIdFromPath = resolvePostIdFromPathname(window.location.pathname);
    const postIdFromOptions = options.postId?.trim() ?? "";
    const postIdFromUrl = postIdFromOptions || postIdFromPath || postIdFromQuery;

    if (mode === "edit" && !postIdFromUrl) {
      setError(elements, "No se detecto id de post. Usa /cms/blog/<id>.");
      setInfo(elements, "");
      setButtonsDisabled(elements, true);
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
      setCurrentStatus(elements, post.status);

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
      fillMultiSelect(elements.tagIds, post.tags);
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
    } else {
      setCurrentStatus(elements, "new");
      setCurrentPostId(elements, null);
      elements.faqList.innerHTML = "";
      elements.faqList.appendChild(createFaqRow());
      setInfo(elements, "Completa campos y guarda como draft.");
    }

    updateCanonicalPreviewOnInputs(elements);
    elements.slug.addEventListener("input", () => updateCanonicalPreviewOnInputs(elements));
    elements.categoryId.addEventListener("change", () => updateCanonicalPreviewOnInputs(elements));

    elements.faqAdd.addEventListener("click", () => {
      elements.faqList.appendChild(createFaqRow());
    });

    elements.backToListLink.href = "/cms/blog";

    elements.saveDraftButton.addEventListener("click", async () => {
      clearMessages(elements);
      setButtonsDisabled(elements, true);
      setInfo(elements, "Guardando draft...");

      try {
        const slug = elements.slug.value.trim();
        assertNonEmpty(slug, "slug");
        assertValidSlug(slug);

        const categoryId = elements.categoryId.value.trim();
        assertNonEmpty(categoryId, "categoria");

        const canonicalUrl = getFormCanonical(elements);
        const featuredImage = readFeaturedImage(elements);
        const schemaOverride = parseJsonObject(elements.schemaOverride.value, "schemaOverride");
        const faqs = readFaqs(elements);
        const tags = readSelectedIds(elements.tagIds);
        const authorId = elements.authorId.value.trim() || null;

        if (mode === "create" || !postId) {
          const created = await createBlogDraft({
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
          });

          setInfo(elements, "Draft creado. Redirigiendo al editor...");
          navigateTo(`/cms/blog/${created.id}`);
          return;
        }

        const updated = await updateBlogPost({
          postId,
          patch: {
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
          },
          tags,
          faqs,
        });

        setCurrentStatus(elements, updated.status);
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
        setCurrentStatus(elements, updated.status);
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
      clearMessages(elements);
      setButtonsDisabled(elements, true);
      setInfo(elements, "Publicando post...");
      try {
        const updated = await updateBlogPostStatus({
          postId,
          status: "published",
          changeReason: "Publicacion desde CMS UI",
        });
        setCurrentStatus(elements, updated.status);
        setInfo(elements, "Post publicado.");
      } catch (error) {
        const message = error instanceof Error ? error.message : "Error al publicar";
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
      clearMessages(elements);
      setButtonsDisabled(elements, true);
      setInfo(elements, "Regresando a draft...");
      try {
        const updated = await updateBlogPostStatus({
          postId,
          status: "draft",
          changeReason: "Revertido desde CMS UI",
        });
        setCurrentStatus(elements, updated.status);
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

