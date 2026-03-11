// @ts-nocheck
import { errorResponse, jsonResponse, methodNotAllowed } from "../../_shared/http.ts";
import { requireAuthContext } from "../../_shared/auth.ts";
import { logCmsApiEvent } from "../../_shared/logger.ts";
import { getCatalogs } from "../services/get-catalogs-service.ts";
import { validateCatalogsQuery } from "../validators/get-catalogs-validator.ts";

export async function handleGetCatalogsRequest(request: Request, requestId: string): Promise<Response> {
  const endpoint = "cms-catalogs";

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

    const payload = validateCatalogsQuery(new URL(request.url).searchParams);
    const catalogs = await getCatalogs(authContext, payload);

    const response = jsonResponse(
      {
        data: catalogs,
        meta: {
          requestId,
          endpoint,
          catalog: payload.catalog,
          includeInactive: payload.includeInactive,
        },
      },
      200,
    );

    await logCmsApiEvent(serviceClient, {
      requestId,
      endpoint,
      method: "GET",
      action: "read_catalogs",
      userId: authUserId,
      userRole: authRole,
      statusCode: 200,
      requestMeta: {
        catalog: payload.catalog,
        includeInactive: payload.includeInactive,
      },
      responseMeta: {
        categoriesCount: catalogs.categories.length,
        authorsCount: catalogs.authors.length,
        tagsCount: catalogs.tags.length,
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
        action: "read_catalogs",
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

