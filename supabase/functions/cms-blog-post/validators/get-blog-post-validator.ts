// @ts-nocheck
import { HttpError } from "../../_shared/errors.ts";
import { expectSlug, expectUuid } from "../../_shared/validators.ts";

export type BlogPostQueryInput =
  | {
      mode: "by-id";
      postId: string;
    }
  | {
      mode: "by-route";
      categorySlug: string;
      slug: string;
    };

export function validateBlogPostQuery(searchParams: URLSearchParams): BlogPostQueryInput {
  const postId = searchParams.get("postId");
  const categorySlug = searchParams.get("categorySlug");
  const slug = searchParams.get("slug");

  if (postId && (categorySlug || slug)) {
    throw new HttpError(
      400,
      "INVALID_QUERY_COMBINATION",
      "Use either postId OR (categorySlug + slug), not both.",
    );
  }

  if (postId) {
    return {
      mode: "by-id",
      postId: expectUuid(postId, "postId"),
    };
  }

  if (categorySlug && slug) {
    return {
      mode: "by-route",
      categorySlug: expectSlug(categorySlug, "categorySlug"),
      slug: expectSlug(slug, "slug"),
    };
  }

  throw new HttpError(
    400,
    "MISSING_QUERY_PARAMS",
    "Provide postId or categorySlug+slug query params.",
  );
}

