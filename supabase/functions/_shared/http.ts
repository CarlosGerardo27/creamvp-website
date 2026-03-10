// @ts-nocheck
import { HttpError, isHttpError } from "./errors.ts";

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-request-id",
  "Access-Control-Allow-Methods": "OPTIONS, GET, POST, PATCH",
  "Content-Type": "application/json; charset=utf-8",
};

export function jsonResponse(payload: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...CORS_HEADERS, ...headers },
  });
}

export function errorResponse(error: unknown): Response {
  if (isHttpError(error)) {
    return jsonResponse(
      {
        error: {
          code: error.code,
          message: error.message,
          details: error.details ?? null,
        },
      },
      error.status,
    );
  }

  console.error("[cms-api] Unexpected error", error);

  return jsonResponse(
    {
      error: {
        code: "INTERNAL_ERROR",
        message: "Unexpected server error.",
      },
    },
    500,
  );
}

export function methodNotAllowed(method: string, allowed: string[]): HttpError {
  return new HttpError(405, "METHOD_NOT_ALLOWED", `Method ${method} not allowed. Allowed: ${allowed.join(", ")}`);
}

export async function parseJsonBody<T>(request: Request): Promise<T> {
  try {
    return (await request.json()) as T;
  } catch {
    throw new HttpError(400, "INVALID_JSON", "Request body must be valid JSON.");
  }
}

export function isPreflightRequest(request: Request): boolean {
  return request.method.toUpperCase() === "OPTIONS";
}

export function preflightResponse(): Response {
  return new Response("ok", {
    status: 200,
    headers: CORS_HEADERS,
  });
}

export function createRequestId(request: Request): string {
  const existing = request.headers.get("x-request-id");
  if (existing && existing.trim().length > 0) {
    return existing.trim();
  }
  return crypto.randomUUID();
}

