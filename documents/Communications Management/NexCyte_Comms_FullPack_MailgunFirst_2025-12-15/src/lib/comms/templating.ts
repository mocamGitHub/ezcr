/**
 * Minimal Mustache-ish renderer:
 * - Supports {{path.to.value}} with HTML escaping
 * - Supports {{{path.to.value}}} (unescaped)
 * - No loops/sections (Phase 1 minimal dependencies)
 */

function escapeHtml(input: any): string {
  const s = String(input ?? "");
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function getPath(obj: any, path: string): any {
  return path.split(".").reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : undefined), obj);
}

export function renderTemplate(template: string, vars: Record<string, any>): string {
  if (!template) return "";

  let out = template.replace(/\{\{\{\s*([\w.]+)\s*\}\}\}/g, (_, p1) => {
    const v = getPath(vars, p1);
    return v === undefined || v === null ? "" : String(v);
  });

  out = out.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_, p1) => {
    const v = getPath(vars, p1);
    return v === undefined || v === null ? "" : escapeHtml(v);
  });

  return out;
}

export function extractPlaceholders(template: string): string[] {
  const set = new Set<string>();
  const re = /\{\{\{?\s*([\w.]+)\s*\}?\}\}/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(template))) set.add(m[1]);
  return Array.from(set).sort();
}
