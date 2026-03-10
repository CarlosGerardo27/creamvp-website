const encoder = new TextEncoder();
const decoder = new TextDecoder();

export type PreviewTokenPayload = {
  postId: string;
  iat: number;
  exp: number;
  nonce: string;
};

function base64UrlEncode(value: Uint8Array): string {
  let binary = "";
  for (const byte of value) {
    binary += String.fromCharCode(byte);
  }
  const base64 = btoa(binary);
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlDecode(value: string): Uint8Array {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

async function signPayload(payloadSegment: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );

  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(payloadSegment));
  return base64UrlEncode(new Uint8Array(signature));
}

function safeStringEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  let mismatch = 0;
  for (let index = 0; index < a.length; index += 1) {
    mismatch |= a.charCodeAt(index) ^ b.charCodeAt(index);
  }
  return mismatch === 0;
}

export async function createPreviewToken(
  postId: string,
  secret: string,
  ttlSeconds = 60 * 30,
): Promise<{ token: string; payload: PreviewTokenPayload; expiresAt: string }> {
  const issuedAt = Math.floor(Date.now() / 1000);
  const payload: PreviewTokenPayload = {
    postId,
    iat: issuedAt,
    exp: issuedAt + ttlSeconds,
    nonce: crypto.randomUUID(),
  };

  const payloadSegment = base64UrlEncode(encoder.encode(JSON.stringify(payload)));
  const signatureSegment = await signPayload(payloadSegment, secret);
  return {
    token: `${payloadSegment}.${signatureSegment}`,
    payload,
    expiresAt: new Date(payload.exp * 1000).toISOString(),
  };
}

export async function verifyPreviewToken(
  token: string,
  secret: string,
  expectedPostId: string,
): Promise<PreviewTokenPayload> {
  const [payloadSegment, signatureSegment] = token.split(".");
  if (!payloadSegment || !signatureSegment) {
    throw new Error("Token de preview invalido.");
  }

  const expectedSignature = await signPayload(payloadSegment, secret);
  if (!safeStringEqual(signatureSegment, expectedSignature)) {
    throw new Error("Firma de preview invalida.");
  }

  const payloadJson = decoder.decode(base64UrlDecode(payloadSegment));
  let payload: unknown;
  try {
    payload = JSON.parse(payloadJson);
  } catch {
    throw new Error("Payload de preview invalido.");
  }

  if (
    !payload ||
    typeof payload !== "object" ||
    typeof (payload as PreviewTokenPayload).postId !== "string" ||
    typeof (payload as PreviewTokenPayload).iat !== "number" ||
    typeof (payload as PreviewTokenPayload).exp !== "number"
  ) {
    throw new Error("Estructura de token invalida.");
  }

  const typed = payload as PreviewTokenPayload;
  if (typed.postId !== expectedPostId) {
    throw new Error("Token no coincide con el post solicitado.");
  }
  if (typed.exp < Math.floor(Date.now() / 1000)) {
    throw new Error("Token de preview expirado.");
  }

  return typed;
}
