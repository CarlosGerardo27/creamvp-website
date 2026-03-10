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

export type BlogPostPatch = {
  slug?: string;
  categoryId?: string;
  h1?: string | null;
  metaDescription?: string | null;
  canonicalUrl?: string | null;
  shortDescription?: string | null;
  featuredImage?: FeaturedImagePayload | null;
  authorId?: string | null;
  contentMarkdown?: string | null;
  schemaOverride?: Record<string, unknown> | null;
  seo?: Record<string, unknown> | null;
};

export type UpdateBlogPostInput = {
  postId: string;
  patch: BlogPostPatch;
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
  return {
    url: expectString(image.url, "patch.featuredImage.url"),
    alt: expectString(image.alt, "patch.featuredImage.alt"),
    metadata: optionalJsonObject(image.metadata, "patch.featuredImage.metadata") ?? undefined,
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

function parsePatch(value: unknown): BlogPostPatch {
  const patch = expectRecord(value, "INVALID_PATCH", "patch must be an object.");

  if ("status" in patch) {
    throw new HttpError(400, "STATUS_NOT_ALLOWED", "Use cms-blog-status endpoint to change status.");
  }

  const normalizedPatch: BlogPostPatch = {};

  if (patch.slug !== undefined) normalizedPatch.slug = expectSlug(patch.slug, "patch.slug");
  if (patch.categoryId !== undefined) normalizedPatch.categoryId = expectUuid(patch.categoryId, "patch.categoryId");
  if (patch.h1 !== undefined) normalizedPatch.h1 = optionalString(patch.h1, "patch.h1");
  if (patch.metaDescription !== undefined) normalizedPatch.metaDescription = optionalString(patch.metaDescription, "patch.metaDescription");
  if (patch.canonicalUrl !== undefined) normalizedPatch.canonicalUrl = optionalString(patch.canonicalUrl, "patch.canonicalUrl");
  if (patch.shortDescription !== undefined) normalizedPatch.shortDescription = optionalString(patch.shortDescription, "patch.shortDescription");
  if (patch.featuredImage !== undefined) normalizedPatch.featuredImage = parseFeaturedImage(patch.featuredImage);
  if (patch.authorId !== undefined) {
    normalizedPatch.authorId =
      patch.authorId === null ? null : expectUuid(patch.authorId, "patch.authorId");
  }
  if (patch.contentMarkdown !== undefined) normalizedPatch.contentMarkdown = optionalString(patch.contentMarkdown, "patch.contentMarkdown");
  if (patch.schemaOverride !== undefined) normalizedPatch.schemaOverride = optionalJsonObject(patch.schemaOverride, "patch.schemaOverride");
  if (patch.seo !== undefined) normalizedPatch.seo = optionalJsonObject(patch.seo, "patch.seo");

  if (Object.keys(normalizedPatch).length === 0) {
    throw new HttpError(400, "EMPTY_PATCH", "patch must include at least one editable field.");
  }

  return normalizedPatch;
}

export function validateUpdateBlogPayload(value: unknown): UpdateBlogPostInput {
  const payload = expectRecord(value);
  const postId = expectUuid(payload.postId, "postId");
  const patch = parsePatch(payload.patch);
  const tags = parseTags(payload.tags);
  const faqs = parseFaqs(payload.faqs);

  return { postId, patch, tags, faqs };
}

