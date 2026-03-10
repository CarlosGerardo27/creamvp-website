// @ts-nocheck
import { HttpError } from "../../_shared/errors.ts";
import type { BlogFaqPayload, FeaturedImagePayload } from "../../_shared/cms-blog-types.ts";
import {
  expectRecord,
  expectSlug,
  expectString,
  expectUuid,
  isRecord,
  optionalJsonObject,
  optionalString,
} from "../../_shared/validators.ts";

export type CreateBlogPostInput = {
  slug: string;
  categoryId: string;
  h1?: string | null;
  metaDescription?: string | null;
  canonicalUrl?: string | null;
  shortDescription?: string | null;
  featuredImage?: FeaturedImagePayload | null;
  authorId?: string | null;
  contentMarkdown?: string | null;
  schemaOverride?: Record<string, unknown> | null;
  seo?: Record<string, unknown> | null;
  tags?: string[];
  faqs?: BlogFaqPayload[];
};

function parseFeaturedImage(value: unknown): FeaturedImagePayload | null | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (value === null) {
    return null;
  }

  const image = expectRecord(value, "INVALID_FEATURED_IMAGE", "featuredImage must be an object.");
  const url = expectString(image.url, "featuredImage.url");
  const alt = expectString(image.alt, "featuredImage.alt");
  const metadata = optionalJsonObject(image.metadata, "featuredImage.metadata");

  return {
    url,
    alt,
    metadata: metadata ?? undefined,
  };
}

function parseTags(value: unknown): string[] | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (!Array.isArray(value)) {
    throw new HttpError(400, "INVALID_TAGS", "tags must be an array of UUIDs.");
  }

  return value.map((tag, index) => expectUuid(tag, `tags[${index}]`));
}

function parseFaqs(value: unknown): BlogFaqPayload[] | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (!Array.isArray(value)) {
    throw new HttpError(400, "INVALID_FAQS", "faqs must be an array.");
  }

  return value.map((faq, index) => {
    if (!isRecord(faq)) {
      throw new HttpError(400, "INVALID_FAQ_ITEM", `faqs[${index}] must be an object.`);
    }

    const question = expectString(faq.question, `faqs[${index}].question`);
    const answer = expectString(faq.answer, `faqs[${index}].answer`);

    let position: number | undefined;
    if (faq.position !== undefined) {
      if (!Number.isInteger(faq.position) || (faq.position as number) < 0) {
        throw new HttpError(400, "INVALID_FAQ_POSITION", `faqs[${index}].position must be an integer >= 0.`);
      }
      position = faq.position as number;
    }

    return { question, answer, position };
  });
}

export function validateCreateBlogPayload(value: unknown): CreateBlogPostInput {
  const payload = expectRecord(value);
  let authorId: string | null | undefined;
  if (payload.authorId === undefined || payload.authorId === null) {
    authorId = payload.authorId as null | undefined;
  } else {
    authorId = expectUuid(payload.authorId, "authorId");
  }

  return {
    slug: expectSlug(payload.slug, "slug"),
    categoryId: expectUuid(payload.categoryId, "categoryId"),
    h1: optionalString(payload.h1, "h1"),
    metaDescription: optionalString(payload.metaDescription, "metaDescription"),
    canonicalUrl: optionalString(payload.canonicalUrl, "canonicalUrl"),
    shortDescription: optionalString(payload.shortDescription, "shortDescription"),
    featuredImage: parseFeaturedImage(payload.featuredImage),
    authorId,
    contentMarkdown: optionalString(payload.contentMarkdown, "contentMarkdown"),
    schemaOverride: optionalJsonObject(payload.schemaOverride, "schemaOverride"),
    seo: optionalJsonObject(payload.seo, "seo"),
    tags: parseTags(payload.tags),
    faqs: parseFaqs(payload.faqs),
  };
}
