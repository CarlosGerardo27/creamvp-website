// @ts-nocheck
import { errorResponse, jsonResponse, methodNotAllowed } from "../../_shared/http.ts";
import { requireAuthContext } from "../../_shared/auth.ts";
import { logCmsApiEvent } from "../../_shared/logger.ts";
import { listBlogPosts } from "../services/list-blog-posts-service.ts";
import { validateListBlogPostsQuery } from "../validators/list-blog-posts-validator.ts";

export async function handleListBlogPostsRequest(request: Request, requestId: string): Promise<Response> {
  const endpoint = "cms-blog-posts";

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

    const payload = validateListBlogPostsQuery(new URL(request.url).searchParams);
    const result = await listBlogPosts(authContext, payload);

    const response = jsonResponse(
      {
        data: result,
        meta: {
          requestId,
          endpoint,
          filters: payload,
        },
      },
      200,
    );

    await logCmsApiEvent(serviceClient, {
      requestId,
      endpoint,
      method: "GET",
      action: "read_posts",
      userId: authUserId,
      userRole: authRole,
      statusCode: 200,
      requestMeta: payload as unknown as Record<string, unknown>,
      responseMeta: {
        total: result.pagination.total,
        returned: result.items.length,
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
        action: "read_posts",
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

