import path from "node:path";
import { parse as parseYaml } from "yaml";

const FRONTMATTER_PATTERN = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/;

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function requireNonEmptyString(value, fieldName, sourceFile) {
  if (!isNonEmptyString(value)) {
    throw new Error(`Campo requerido '${fieldName}' vacio en ${sourceFile}`);
  }
  return value.trim();
}

function normalizeImage(image, title, sourceFile) {
  if (image && typeof image === "object" && !Array.isArray(image)) {
    const src = isNonEmptyString(image.src) ? image.src.trim() : "/opengraph.png";
    const alt = isNonEmptyString(image.alt) ? image.alt.trim() : title;
    return { src, alt };
  }

  if (isNonEmptyString(image)) {
    return {
      src: image.trim(),
      alt: title,
    };
  }

  if (image !== undefined && image !== null) {
    throw new Error(`Campo 'image' invalido en ${sourceFile}`);
  }

  return {
    src: "/opengraph.png",
    alt: title,
  };
}

function normalizeTags(tags) {
  if (!Array.isArray(tags)) {
    return [];
  }

  const seen = new Set();
  const normalized = [];
  for (const tag of tags) {
    const tagName = isNonEmptyString(tag) ? tag.trim() : "";
    const tagSlug = slugify(tagName);
    if (!tagSlug || seen.has(tagSlug)) {
      continue;
    }
    seen.add(tagSlug);
    normalized.push({
      name: tagName,
      slug: tagSlug,
    });
  }

  return normalized;
}

function normalizeFaqs(faqs) {
  if (!Array.isArray(faqs)) {
    return [];
  }

  const normalized = [];
  faqs.forEach((faq, index) => {
    if (!faq || typeof faq !== "object") {
      return;
    }

    const question = isNonEmptyString(faq.question) ? faq.question.trim() : "";
    const answer = isNonEmptyString(faq.answer) ? faq.answer.trim() : "";
    if (!question || !answer) {
      return;
    }

    normalized.push({ question, answer, position: index });
  });

  return normalized;
}

function extractSnippet(snippet, body) {
  if (isNonEmptyString(snippet)) {
    return snippet.trim();
  }

  const firstParagraph = body
    .split(/\r?\n\s*\r?\n/)
    .map((chunk) => chunk.replace(/\s+/g, " ").trim())
    .find((chunk) => chunk.length > 0);

  if (firstParagraph) {
    return firstParagraph.slice(0, 220);
  }

  return "";
}

function parsePublishDate(value, sourceFile) {
  if (!isNonEmptyString(value)) {
    throw new Error(`Campo requerido 'publishDate' vacio en ${sourceFile}`);
  }

  const parsed = new Date(value.trim());
  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`Campo 'publishDate' invalido en ${sourceFile}: ${value}`);
  }

  return parsed;
}

export function slugify(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function splitMarkdownFrontmatter(markdownContent, sourceFile = "<memory>") {
  const normalized = String(markdownContent ?? "").replace(/^\uFEFF/, "");
  const match = normalized.match(FRONTMATTER_PATTERN);
  if (!match) {
    throw new Error(`No se encontro frontmatter YAML valido en ${sourceFile}`);
  }

  return {
    frontmatterYaml: match[1] ?? "",
    body: (match[2] ?? "").trim(),
  };
}

export function buildCanonicalBlogUrl(categorySlug, slug) {
  return `https://creamvp.com/blog/${categorySlug}/${slug}`;
}

export function parseMarkdownBlogDocument(sourceFile, markdownContent) {
  const { frontmatterYaml, body } = splitMarkdownFrontmatter(markdownContent, sourceFile);
  const frontmatterRaw = parseYaml(frontmatterYaml) ?? {};

  if (!frontmatterRaw || typeof frontmatterRaw !== "object" || Array.isArray(frontmatterRaw)) {
    throw new Error(`Frontmatter invalido en ${sourceFile}`);
  }

  const title = requireNonEmptyString(frontmatterRaw.title, "title", sourceFile);
  const slugFromFile = slugify(path.basename(sourceFile, path.extname(sourceFile)));
  if (!slugFromFile) {
    throw new Error(`No se pudo derivar slug desde filename en ${sourceFile}`);
  }

  const categoryName = isNonEmptyString(frontmatterRaw.category)
    ? frontmatterRaw.category.trim()
    : "General";
  const categorySlug = slugify(categoryName) || "general";
  const snippet = extractSnippet(frontmatterRaw.snippet, body);
  if (!snippet) {
    throw new Error(`No se pudo resolver snippet para ${sourceFile}`);
  }

  const publishDate = parsePublishDate(frontmatterRaw.publishDate, sourceFile);
  const image = normalizeImage(frontmatterRaw.image, title, sourceFile);
  const authorName = isNonEmptyString(frontmatterRaw.author)
    ? frontmatterRaw.author.trim()
    : "CreaMVP";
  const tags = normalizeTags(frontmatterRaw.tags);
  const faqs = normalizeFaqs(frontmatterRaw.faqs);

  if (!body) {
    throw new Error(`Contenido markdown vacio en ${sourceFile}`);
  }

  return {
    sourceFile,
    draft: Boolean(frontmatterRaw.draft),
    title,
    slug: slugFromFile,
    snippet,
    body,
    imageSrc: image.src,
    imageAlt: image.alt,
    publishDate,
    categoryName,
    categorySlug,
    authorName,
    tags,
    faqs,
  };
}

export function toCmsMigrationPost(parsedPost, options = {}) {
  const forceDraft = Boolean(options.forceDraft);
  const status = forceDraft || parsedPost.draft ? "draft" : "published";

  return {
    sourceFile: parsedPost.sourceFile,
    status,
    slug: parsedPost.slug,
    title: parsedPost.title,
    snippet: parsedPost.snippet,
    contentMarkdown: parsedPost.body,
    imageSrc: parsedPost.imageSrc,
    imageAlt: parsedPost.imageAlt,
    publishDateIso: parsedPost.publishDate.toISOString(),
    categoryName: parsedPost.categoryName,
    categorySlug: parsedPost.categorySlug,
    canonicalUrl: buildCanonicalBlogUrl(parsedPost.categorySlug, parsedPost.slug),
    authorName: parsedPost.authorName,
    authorSlug: slugify(parsedPost.authorName) || "autor-sin-slug",
    tags: parsedPost.tags,
    faqs: parsedPost.faqs,
  };
}

export function renderInventoryMarkdown(parsedPosts) {
  const rows = parsedPosts
    .map((post) => {
      return `| ${post.sourceFile.replace(/\|/g, "\\|")} | ${post.title.replace(/\|/g, "\\|")} | ${post.categorySlug} | ${post.slug} | ${post.draft ? "draft" : "published"} | ${post.tags.length} |`;
    })
    .join("\n");

  return [
    "# Inventario Markdown Blog",
    "",
    `Generado: ${new Date().toISOString()}`,
    "",
    "| Archivo | Titulo | Categoria slug | Slug | Estado origen | Tags |",
    "| --- | --- | --- | --- | --- | --- |",
    rows || "| - | - | - | - | - | - |",
    "",
  ].join("\n");
}
