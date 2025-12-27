/**
 * Minimal template rendering (mustache-lite).
 * Replace with your existing template engine if you have one.
 */
export function renderTemplate(template: string | null | undefined, data: Record<string, any>): string | null {
  if (!template) return null;
  return template.replace(/\{\{\s*([a-zA-Z0-9_\.]+)\s*\}\}/g, (_, key) => {
    const parts = String(key).split(".");
    let cur: any = data;
    for (const p of parts) cur = cur?.[p];
    return cur === undefined || cur === null ? "" : String(cur);
  });
}
