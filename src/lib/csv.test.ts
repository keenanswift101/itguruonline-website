import { describe, it, expect } from "vitest";
import { csvEscape, csvRow } from "./csv";

describe("csvEscape", () => {
  it("returns plain value unchanged when no special characters", () => {
    expect(csvEscape("plain")).toBe("plain");
  });

  it("wraps in quotes when value contains a comma", () => {
    expect(csvEscape("a,b")).toBe('"a,b"');
  });

  it("doubles internal quotes and wraps when value contains double-quotes", () => {
    expect(csvEscape('she said "hi"')).toBe('"she said ""hi"""');
  });

  it("wraps in quotes when value contains a newline", () => {
    const result = csvEscape("line1\nline2");
    expect(result).toBe('"line1\nline2"');
  });

  it("wraps in quotes when value contains a carriage return", () => {
    const result = csvEscape("line1\r\nline2");
    expect(result).toBe('"line1\r\nline2"');
  });

  it("neutralises formula injection: = prefix gets a leading single quote", () => {
    const result = csvEscape("=1+1");
    expect(result.startsWith("'")).toBe(true);
    expect(result).toBe("'=1+1");
  });

  it("neutralises formula injection: + prefix", () => {
    const result = csvEscape("+27821234567");
    expect(result.startsWith("'")).toBe(true);
    expect(result).toBe("'+27821234567");
  });

  it("neutralises formula injection: - prefix", () => {
    const result = csvEscape("-5");
    expect(result.startsWith("'")).toBe(true);
    expect(result).toBe("'-5");
  });

  it("neutralises formula injection: @ prefix", () => {
    const result = csvEscape("@xss");
    expect(result.startsWith("'")).toBe(true);
    expect(result).toBe("'@xss");
  });

  it("returns empty string for empty input", () => {
    expect(csvEscape("")).toBe("");
  });

  it("returns empty string for null input", () => {
    expect(csvEscape(null as unknown as string)).toBe("");
  });

  it("returns empty string for undefined input", () => {
    expect(csvEscape(undefined as unknown as string)).toBe("");
  });

  it("handles formula prefix combined with comma — both neutralise and wrap", () => {
    // "=hello, world" → prepend ' → "'=hello, world" → has comma → wrap → "'=hello, world""
    const result = csvEscape("=hello, world");
    expect(result.startsWith('"')).toBe(true);
    expect(result).toBe('"\'=hello, world"');
  });
});

describe("csvRow", () => {
  it("joins fields with comma and escapes each", () => {
    expect(csvRow(["a", "b,c", "d"])).toBe('a,"b,c",d');
  });

  it("handles mixed field types (number, boolean, string)", () => {
    expect(csvRow([1, true, "hello"])).toBe("1,true,hello");
  });
});
