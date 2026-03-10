import { describe, expect, it } from "vitest";
import {
  buildCanonicalUrl,
  buildPublicAuthor,
  normalizeOptionalString,
  normalizeTagRelation,
} from "./public-blog-mappers";

describe("public-blog-repository helpers", () => {
  it("normalizeOptionalString limpia espacios y devuelve null cuando corresponde", () => {
    expect(normalizeOptionalString("  hola  ")).toBe("hola");
    expect(normalizeOptionalString("   ")).toBeNull();
    expect(normalizeOptionalString(null)).toBeNull();
  });

  it("buildCanonicalUrl mantiene contrato /blog/[categoria]/[slug]", () => {
    expect(buildCanonicalUrl("automatizacion", "ahorrar-tiempo")).toBe(
      "https://creamvp.com/blog/automatizacion/ahorrar-tiempo",
    );
  });

  it("buildPublicAuthor aplica fallback cuando la relacion viene vacia", () => {
    const author = buildPublicAuthor(null);

    expect(author.name).toBe("CreaMVP");
    expect(author.bio).toBeNull();
    expect(author.photoUrl).toBeNull();
    expect(author.socialLinks).toEqual({
      facebookUrl: null,
      instagramUrl: null,
      xUrl: null,
      tiktokUrl: null,
      linkedinUrl: null,
      personalUrl: null,
    });
  });

  it("buildPublicAuthor mapea campos de redes y datos de perfil", () => {
    const author = buildPublicAuthor({
      name: "  Carlos CreaMVP ",
      bio: "  Estratega digital ",
      photo_url: "https://images.example.com/carlos.jpg",
      facebook_url: "https://facebook.com/carlos",
      instagram_url: null,
      x_url: "https://x.com/carlos",
      tiktok_url: "",
      linkedin_url: "https://linkedin.com/in/carlos",
      personal_url: " https://creamvp.com ",
    });

    expect(author.name).toBe("Carlos CreaMVP");
    expect(author.bio).toBe("Estratega digital");
    expect(author.photoUrl).toBe("https://images.example.com/carlos.jpg");
    expect(author.socialLinks).toEqual({
      facebookUrl: "https://facebook.com/carlos",
      instagramUrl: null,
      xUrl: "https://x.com/carlos",
      tiktokUrl: null,
      linkedinUrl: "https://linkedin.com/in/carlos",
      personalUrl: "https://creamvp.com",
    });
  });

  it("normalizeTagRelation soporta objeto o arreglo y filtra tags invalidos", () => {
    expect(normalizeTagRelation({ name: "IA", slug: "ia" })).toEqual([{ name: "IA", slug: "ia" }]);
    expect(
      normalizeTagRelation([
        { name: " Automatizacion ", slug: " automatizacion " },
        { name: "", slug: "sin-nombre" },
      ]),
    ).toEqual([{ name: "Automatizacion", slug: "automatizacion" }]);
    expect(normalizeTagRelation(null)).toEqual([]);
  });
});
