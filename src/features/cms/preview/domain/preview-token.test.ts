import { describe, expect, it } from "vitest";
import { createPreviewToken, verifyPreviewToken } from "./preview-token";

const SECRET = "test-preview-secret-2026";

describe("cms/preview/domain/preview-token", () => {
  it("creates and verifies a valid token", async () => {
    const created = await createPreviewToken("post-123", SECRET, 60);
    expect(created.token).toContain(".");

    const payload = await verifyPreviewToken(created.token, SECRET, "post-123");
    expect(payload.postId).toBe("post-123");
    expect(payload.exp).toBeGreaterThan(payload.iat);
  });

  it("rejects mismatched post id", async () => {
    const created = await createPreviewToken("post-abc", SECRET, 60);
    await expect(verifyPreviewToken(created.token, SECRET, "post-xyz")).rejects.toThrow(
      /no coincide/i,
    );
  });

  it("rejects malformed token", async () => {
    await expect(verifyPreviewToken("invalid", SECRET, "post-1")).rejects.toThrow(/invalido/i);
  });
});
