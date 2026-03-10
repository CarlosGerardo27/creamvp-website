// @ts-nocheck
import { errorResponse, jsonResponse, methodNotAllowed, parseJsonBody } from "../../_shared/http.ts";
import { requireAuthContext } from "../../_shared/auth.ts";
import { logCmsApiEvent } from "../../_shared/logger.ts";
import { createDraftBlogPost } from "../services/create-blog-service.ts";
import { validateCreateBlogPayload } from "../validators/create-blog-validator.ts";

export async function handleCreateBlogRequest(request: Request, requestId: string): Promise<Response> {
  const endpoint = "cms-blog-create";

  if (request.method !== "POST") {
    return errorResponse(methodNotAllowed(request.method, ["POST"]));
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
    const payload = validateCreateBlogPayload(body);
    const post = await createDraftBlogPost(authContext, payload);

    const response = jsonResponse(
      {
        data: post,
        meta: {
          requestId,
          endpoint,
        },
      },
      201,
    );

    await logCmsApiEvent(serviceClient, {
      requestId,
      endpoint,
      method: "POST",
      action: "create_draft",
      userId: authUserId,
      userRole: authRole,
      statusCode: 201,
      requestMeta: {
        slug: payload.slug,
        categoryId: payload.categoryId,
        tagsCount: payload.tags?.length ?? 0,
        faqsCount: payload.faqs?.length ?? 0,
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
        method: "POST",
        action: "create_draft",
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

