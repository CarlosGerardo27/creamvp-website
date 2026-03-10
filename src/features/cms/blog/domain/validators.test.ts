import { describe, expect, it } from "vitest";
import {
  assertNonEmpty,
  assertValidSlug,
  parseJsonObject,
  parseOptionalIsoDate,
} from "./validators";

describe("cms/blog/domain/validators", () => {
  it("accepts valid slug format", () => {
    expect(() => assertValidSlug("mi-slug-2026")).not.toThrow();
  });

  it("rejects invalid slug format", () => {
    expect(() => assertValidSlug("Slug Invalido")).toThrow(/Slug invalido/);
  });

  it("requires non-empty fields", () => {
    expect(() => assertNonEmpty("", "slug")).toThrow(/slug/);
    expect(() => assertNonEmpty("ok", "slug")).not.toThrow();
  });

  it("parses optional JSON object", () => {
    expect(parseJsonObject("", "schema")).toBeNull();
    const parsed = parseJsonObject('{"foo":"bar"}', "schema");
    expect(parsed).toEqual({ foo: "bar" });
  });

  it("fails when JSON is not object", () => {
    expect(() => parseJsonObject('["x"]', "schema")).toThrow(/objeto JSON/);
  });

  it("parses optional ISO date", () => {
    const input = "2026-03-20T10:30";
    const date = parseOptionalIsoDate(input);
    expect(date).toBe(new Date(input).toISOString());
    expect(parseOptionalIsoDate("   ")).toBeNull();
  });
});
