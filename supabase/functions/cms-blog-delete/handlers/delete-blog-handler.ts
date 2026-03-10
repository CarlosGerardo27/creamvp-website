// @ts-nocheck
import { errorResponse, jsonResponse, methodNotAllowed, parseJsonBody } from "../../_shared/http.ts";
import { requireAuthContext } from "../../_shared/auth.ts";
import { logCmsApiEvent } from "../../_shared/logger.ts";
import { deleteBlogPost } from "../services/delete-blog-service.ts";
import { validateDeleteBlogPayload } from "../validators/delete-blog-validator.ts";

export async function handleDeleteBlogRequest(request: Request, requestId: string): Promise<Response> {
  const endpoint = "cms-blog-delete";

  if (request.method !== "DELETE") {
    return errorResponse(methodNotAllowed(request.method, ["DELETE"]));
  }

  let authRole: "admin" | "editor" | "reviewer" | "developer" | null = null;
  let authUserId: string | null = null;
  let serviceClient = null;

  try {
    const authContext = await requireAuthContext(request, requestId);
    authRole = authContext.profile.role;
    authUserId = authContext.user.id;
    serviceClient = authContext.serviceClient;

    const body = await parseJsonBody<unknown>(request);
    const payload = validateDeleteBlogPayload(body);
    const deletedPost = await deleteBlogPost(authContext, payload);

    const response = jsonResponse(
      {
        data: {
          ...deletedPost,
          deleted: true,
        },
        meta: {
          requestId,
          endpoint,
          changeReason: payload.changeReason ?? null,
        },
      },
      200,
    );

    await logCmsApiEvent(serviceClient, {
      requestId,
      endpoint,
      method: "DELETE",
      action: "delete_post",
      userId: authUserId,
      userRole: authRole,
      statusCode: 200,
      requestMeta: {
        postId: payload.postId,
        changeReason: payload.changeReason ?? null,
      },
      responseMeta: {
        postId: deletedPost.id,
        slug: deletedPost.slug,
        status: deletedPost.status,
        deleted: true,
      },
    });

    return response;
  } catch (error) {
    const response = errorResponse(error);

    if (serviceClient && authUserId && authRole) {
      await logCmsApiEvent(serviceClient, {
        requestId,
        endpoint,
        method: "DELETE",
        action: "delete_post",
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

