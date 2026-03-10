import { getCmsRequestContext, resolveFunctionsBaseUrl } from "./request-context";

type FunctionMethod = "POST" | "PATCH" | "DELETE";

type FunctionErrorPayload = {
  error?: {
    code?: string;
    message?: string;
    details?: unknown;
  };
};

export async function invokeCmsFunction<TResponse>(
  functionName: string,
  method: FunctionMethod,
  payload: unknown,
): Promise<TResponse> {
  const context = await getCmsRequestContext();
  const endpoint = `${resolveFunctionsBaseUrl(context.supabaseUrl)}/${functionName}`;
  const requestId = crypto.randomUUID();

  const response = await fetch(endpoint, {
    method,
    headers: {
      "Content-Type": "application/json",
      apikey: context.anonKey,
      Authorization: `Bearer ${context.accessToken}`,
      "x-request-id": requestId,
    },
    body: JSON.stringify(payload),
  });

  let body: unknown = null;
  try {
    body = await response.json();
  } catch {
    body = null;
  }

  if (!response.ok) {
    const parsed = body as FunctionErrorPayload | null;
    const errorMessage =
      parsed?.error?.message ??
      `Error en ${functionName}: ${response.status} ${response.statusText}`;
    throw new Error(errorMessage);
  }

  return body as TResponse;
}
