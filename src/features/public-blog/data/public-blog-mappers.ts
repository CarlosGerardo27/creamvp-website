import type { PublicBlogAuthor, PublicBlogTag } from "../domain/types";

export type CmsAuthorRelationRow = {
  name: string | null;
  bio: string | null;
  photo_url: string | null;
  facebook_url: string | null;
  instagram_url: string | null;
  x_url: string | null;
  tiktok_url: string | null;
  linkedin_url: string | null;
  personal_url: string | null;
};

export type CmsTagRelationValue =
  | { name: string | null; slug: string | null }
  | { name: string | null; slug: string | null }[]
  | null;

export function normalizeOptionalString(value: string | null | undefined): string | null {
  const normalized = String(value ?? "").trim();
  return normalized || null;
}

export function normalizeTagRelation(value: CmsTagRelationValue): PublicBlogTag[] {
  if (!value) {
    return [];
  }

  const normalized = Array.isArray(value) ? value : [value];
  return normalized
    .map((tag) => ({
      name: String(tag.name ?? "").trim(),
      slug: String(tag.slug ?? "").trim(),
    }))
    .filter((tag) => tag.name && tag.slug);
}

export function buildCanonicalUrl(categorySlug: string, slug: string): string {
  return `https://creamvp.com/blog/${categorySlug}/${slug}`;
}

export function buildPublicAuthor(authorRelation: CmsAuthorRelationRow | null): PublicBlogAuthor {
  const name = normalizeOptionalString(authorRelation?.name) ?? "CreaMVP";
  return {
    name,
    bio: normalizeOptionalString(authorRelation?.bio),
    photoUrl: normalizeOptionalString(authorRelation?.photo_url),
    socialLinks: {
      facebookUrl: normalizeOptionalString(authorRelation?.facebook_url),
      instagramUrl: normalizeOptionalString(authorRelation?.instagram_url),
      xUrl: normalizeOptionalString(authorRelation?.x_url),
      tiktokUrl: normalizeOptionalString(authorRelation?.tiktok_url),
      linkedinUrl: normalizeOptionalString(authorRelation?.linkedin_url),
      personalUrl: normalizeOptionalString(authorRelation?.personal_url),
    },
  };
}
