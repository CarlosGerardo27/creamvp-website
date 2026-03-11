// @ts-nocheck
import { errorResponse, jsonResponse, methodNotAllowed } from "../../_shared/http.ts";
import { requireAuthContext } from "../../_shared/auth.ts";
import { logCmsApiEvent } from "../../_shared/logger.ts";
import { getBlogPostDetails } from "../services/get-blog-post-service.ts";
import { validateBlogPostQuery } from "../validators/get-blog-post-validator.ts";

export async function handleGetBlogPostRequest(request: Request, requestId: string): Promise<Response> {
  const endpoint = "cms-blog-post";

  if (request.method !== "GET") {
    return errorResponse(methodNotAllowed(request.method, ["GET"]));
  }

  let authRole: "admin" | "editor" | "reviewer" | "developer" | null = null;
  let authUserId: string | null = null;
  let serviceClient = null;

  try {
    const authContext = await requireAuthContext(request, requestId);
    authRole = authContext.profile.role;
    authUserId = authContext.user.id;
    serviceClient = authContext.serviceClient;

    const payload = validateBlogPostQuery(new URL(request.url).searchParams);
    const post = await getBlogPostDetails(authContext, payload);

    const response = jsonResponse(
      {
        data: post,
        meta: {
          requestId,
          endpoint,
          lookup: payload.mode === "by-id" ? "postId" : "categorySlug+slug",
        },
      },
      200,
    );

    await logCmsApiEvent(serviceClient, {
      requestId,
      endpoint,
      method: "GET",
      action: "read_post",
      userId: authUserId,
      userRole: authRole,
      statusCode: 200,
      requestMeta: {
        mode: payload.mode,
        postId: payload.mode === "by-id" ? payload.postId : null,
        categorySlug: payload.mode === "by-route" ? payload.categorySlug : null,
        slug: payload.mode === "by-route" ? payload.slug : null,
      },
      responseMeta: {
        postId: post.id,
        status: post.status,
      },
    });

    return response;
  } catch (error) {
    const response = errorResponse(error);

    if (serviceClient && authUserId && authRole) {
      await logCmsApiEvent(serviceClient, {
        requestId,
        endpoint,
        method: "GET",
        action: "read_post",
        userId: authUserId,
        userRole: authRole,
        statusCode: response.status,
        responseMeta: {
          failed: true,
        },
      });
    }

    return response;
  }
}

