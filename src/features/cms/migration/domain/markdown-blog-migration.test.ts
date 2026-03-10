import { describe, expect, it } from "vitest";
import {
  buildCanonicalBlogUrl,
  parseMarkdownBlogDocument,
  renderInventoryMarkdown,
  slugify,
  splitMarkdownFrontmatter,
  toCmsMigrationPost,
} from "./markdown-blog-migration.mjs";

describe("markdown-blog-migration", () => {
  it("slugify normaliza acentos y caracteres especiales", () => {
    expect(slugify("Automatizaci\u00f3n + IA")).toBe("automatizacion-ia");
    expect(slugify("  Hola   Mundo  ")).toBe("hola-mundo");
  });

  it("splitMarkdownFrontmatter separa YAML y body", () => {
    const markdown = `---\ntitle: Test\n---\n\nContenido`;
    const parts = splitMarkdownFrontmatter(markdown, "post.md");

    expect(parts.frontmatterYaml).toContain("title: Test");
    expect(parts.body).toBe("Contenido");
  });

  it("parseMarkdownBlogDocument mapea frontmatter al contrato esperado", () => {
    const markdown = `---
 draft: false
 title: "Titulo principal"
 snippet: "Resumen SEO"
 image:
   src: "/images/post.avif"
   alt: "Imagen post"
 publishDate: "2026-01-05 10:00"
 category: "Automatizaci\u00f3n"
 author: "Carlos Rocha"
 tags: [automatizacion, ia]
 faqs:
   - question: "Pregunta 1"
     answer: "Respuesta 1"
---

Contenido markdown del post`;

    const parsed = parseMarkdownBlogDocument(
      "src/content/blog/mi-post-increible.md",
      markdown,
    );

    expect(parsed.slug).toBe("mi-post-increible");
    expect(parsed.categorySlug).toBe("automatizacion");
    expect(parsed.authorName).toBe("Carlos Rocha");
    expect(parsed.tags).toEqual([
      { name: "automatizacion", slug: "automatizacion" },
      { name: "ia", slug: "ia" },
    ]);
    expect(parsed.faqs).toEqual([
      { question: "Pregunta 1", answer: "Respuesta 1", position: 0 },
    ]);
  });

  it("toCmsMigrationPost respeta forceDraft y canonical", () => {
    const parsed = parseMarkdownBlogDocument(
      "src/content/blog/post-demo.md",
      `---\ndraft: false\ntitle: "Demo"\nsnippet: "Resumen"\nimage: { src: "/img.avif", alt: "alt" }\npublishDate: "2026-01-05"\ncategory: "No Code"\nauthor: "Test"\ntags: [nocode]\n---\n\nContenido`,
    );

    const cmsDraft = toCmsMigrationPost(parsed, { forceDraft: true });
    const cmsPublished = toCmsMigrationPost(parsed, { forceDraft: false });

    expect(cmsDraft.status).toBe("draft");
    expect(cmsPublished.status).toBe("published");
    expect(cmsPublished.canonicalUrl).toBe(buildCanonicalBlogUrl("no-code", "post-demo"));
  });

  it("parseMarkdownBlogDocument falla cuando falta frontmatter requerido", () => {
    expect(() =>
      parseMarkdownBlogDocument(
        "src/content/blog/sin-title.md",
        `---\ndraft: true\npublishDate: "2026-01-05"\n---\n\nContenido`,
      ),
    ).toThrow(/title/i);
  });

  it("renderInventoryMarkdown crea tabla legible", () => {
    const parsed = parseMarkdownBlogDocument(
      "src/content/blog/inventario.md",
      `---\ndraft: true\ntitle: "Inventario"\nsnippet: "Resumen"\nimage: { src: "/img.avif", alt: "alt" }\npublishDate: "2026-01-05"\ncategory: "General"\nauthor: "CreaMVP"\ntags: []\n---\n\nContenido`,
    );

    const markdown = renderInventoryMarkdown([parsed]);
    expect(markdown).toContain("| Archivo | Titulo | Categoria slug | Slug | Estado origen | Tags |");
    expect(markdown).toContain("inventario.md");
  });
});
