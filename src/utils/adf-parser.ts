export function extractTextFromAdf(element: unknown): string | undefined {
  if (element == null) return undefined;

  if (typeof element === "string") return element;

  if (Array.isArray(element)) {
    const parts = element.map(extractTextFromAdf).filter(Boolean);
    return parts.length > 0 ? parts.join(" ") : undefined;
  }

  if (typeof element === "object") {
    const obj = element as Record<string, unknown>;
    if (obj.type === "text" && typeof obj.text === "string") {
      return obj.text;
    }
    if (obj.content) {
      return extractTextFromAdf(obj.content);
    }
  }

  return undefined;
}
