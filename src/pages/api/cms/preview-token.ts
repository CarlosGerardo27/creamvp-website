import type { APIRoute } from "astro";
import { createPreviewToken } from "@/features/cms/preview/domain/preview-token";
import {
  getPreviewPostById,
  readCmsServerPreviewEnv,
  requireAuthenticatedCmsUser,
} from "@/features/cms/preview/data/preview-repository";

export const prerender = false;

function jsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

export const POST: APIRoute = async ({ request, url }) => {
  try {
    const authenticatedUser = await requireAuthenticatedCmsUser(
      request.headers.get("authorization") ?? request.headers.get("Authorization"),
    );

    const body = (await request.json()) as { postId?: string };
    const postId = body?.postId?.trim() ?? "";
    if (!postId) {
      return jsonResponse(
        {
          error: {
            code: "MISSING_POST_ID",
            message: "postId es obligatorio.",
          },
        },
        400,
      );
    }

    const postBundle = await getPreviewPostById(postId);
    if (!postBundle) {
      return jsonResponse(
        {
          error: {
            code: "POST_NOT_FOUND",
            message: "No existe post para preview.",
          },
        },
        404,
      );
    }

    if (!["draft", "scheduled"].includes(postBundle.post.status)) {
      return jsonResponse(
        {
          error: {
            code: "PREVIEW_NOT_ALLOWED_FOR_STATUS",
            message: "Preview tokenizado solo aplica para draft o scheduled.",
          },
        },
        409,
      );
    }

    const env = readCmsServerPreviewEnv();
    const tokenPayload = await createPreviewToken(postId, env.previewTokenSecret, 60 * 30);
    const previewUrl = new URL(`/blog/preview/${postId}`, url);
    previewUrl.searchParams.set("pt", tokenPayload.token);

    return jsonResponse({
      data: {
        postId,
        status: postBundle.post.status,
        previewUrl: previewUrl.toString(),
        token: tokenPayload.token,
        expiresAt: tokenPayload.expiresAt,
      },
      meta: {
        generatedBy: authenticatedUser.userId,
        generatedRole: authenticatedUser.role,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error interno generando token preview.";
    return jsonResponse(
      {
        error: {
          code: "PREVIEW_TOKEN_ERROR",
          message,
        },
      },
      401,
    );
  }
};
