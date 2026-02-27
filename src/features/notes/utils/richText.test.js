import { describe, expect, it } from "vitest";
import { normalizeHtml, sanitizeRichHtml } from "./richText";

describe("sanitizeRichHtml", () => {
  it("removes disallowed tags and keeps allowed formatting", () => {
    const input = '<p>Merhaba <strong>dunya</strong><script>alert(1)</script></p>';
    const output = sanitizeRichHtml(input);

    expect(output).toBe("<p>Merhaba <strong>dunya</strong>alert(1)</p>");
  });

  it("drops non-html namespace nodes", () => {
    const input = '<svg><script>alert(1)</script></svg><p>Temiz</p>';
    const output = sanitizeRichHtml(input);

    expect(output).toBe("<p>Temiz</p>");
  });

  it("normalizes empty content to empty string", () => {
    expect(normalizeHtml("<p><br></p>")).toBe("");
  });
});
