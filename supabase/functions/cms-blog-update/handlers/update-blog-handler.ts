// @ts-nocheck
import { errorResponse, jsonResponse, methodNotAllowed, parseJsonBody } from "../../_shared/http.ts";
import { requireAuthContext } from "../../_shared/auth.ts";
import { logCmsApiEvent } from "../../_shared/logger.ts";
import { updateBlogPost } from "../services/update-blog-service.ts";
import { validateUpdateBlogPayload } from "../validators/update-blog-validator.ts";

export async function handleUpdateBlogRequest(request: Request, requestId: string): Promise<Response> {
  const endpoint = "cms-blog-update";

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
    const payload = validateUpdateBlogPayload(body);
    const post = await updateBlogPost(authContext, payload);

    const response = jsonResponse(
      {
        data: post,
        meta: {
          requestId,
          endpoint,
        },
      },
      200,
    );

    await logCmsApiEvent(serviceClient, {
      requestId,
      endpoint,
      method: "PATCH",
      action: "update_post",
      userId: authUserId,
      userRole: authRole,
      statusCode: 200,
      requestMeta: {
        postId: payload.postId,
        patchFields: Object.keys(payload.patch),
        tagsTouched: Array.isArray(payload.tags),
        faqsTouched: Array.isArray(payload.faqs),
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
        action: "update_post",
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

