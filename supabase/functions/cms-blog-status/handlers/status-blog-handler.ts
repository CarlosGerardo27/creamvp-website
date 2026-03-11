// @ts-nocheck
import { errorResponse, jsonResponse, methodNotAllowed, parseJsonBody } from "../../_shared/http.ts";
import { requireAuthContext } from "../../_shared/auth.ts";
import { logCmsApiEvent } from "../../_shared/logger.ts";
import { changeBlogPostStatus } from "../services/status-blog-service.ts";
import { validateStatusBlogPayload } from "../validators/status-blog-validator.ts";

export async function handleStatusBlogRequest(request: Request, requestId: string): Promise<Response> {
  const endpoint = "cms-blog-status";

  if (request.method !== "PATCH") {
    return errorResponse(methodNotAllowed(request.method, ["PATCH"]));
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
    const payload = validateStatusBlogPayload(body);
    const post = await changeBlogPostStatus(authContext, payload);

    const response = jsonResponse(
      {
        data: post,
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
      method: "PATCH",
      action: "change_status",
      userId: authUserId,
      userRole: authRole,
      statusCode: 200,
      requestMeta: {
        postId: payload.postId,
        targetStatus: payload.status,
        scheduledPublishAt: payload.scheduledPublishAt ?? null,
        publishDate: payload.publishDate ?? null,
        changeReason: payload.changeReason ?? null,
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
        method: "PATCH",
        action: "change_status",
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
