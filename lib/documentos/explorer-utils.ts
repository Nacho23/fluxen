/** Cadena de carpetas desde la raíz hasta `currentFolderId`. */
export function buildFolderBreadcrumb(
  folders: { id: string; parentId: string | null; name: string }[],
  currentFolderId: string | null,
): { id: string; name: string }[] {
  if (!currentFolderId) return [];
  const byId = new Map(folders.map((f) => [f.id, f]));
  const out: { id: string; name: string }[] = [];
  let cur: string | null = currentFolderId;
  const guard = new Set<string>();
  while (cur) {
    if (guard.has(cur)) break;
    guard.add(cur);
    const f = byId.get(cur);
    if (!f) break;
    out.unshift({ id: f.id, name: f.name });
    cur = f.parentId;
  }
  return out;
}

/** Opciones para `<select>` de ubicación (incluye raíz). */
export function flattenFoldersForSelect(
  folders: { id: string; parentId: string | null; name: string }[],
): { id: string; label: string }[] {
  const result: { id: string; label: string }[] = [{ id: "__root__", label: "Raíz" }];
  function walk(parentId: string | null, depth: number) {
    const kids = folders
      .filter((f) => f.parentId === parentId)
      .sort((a, b) => a.name.localeCompare(b.name, "es"));
    for (const k of kids) {
      const pad = depth > 0 ? `${"· ".repeat(depth)}` : "";
      result.push({ id: k.id, label: `${pad}${k.name}` });
      walk(k.id, depth + 1);
    }
  }
  walk(null, 0);
  return result;
}

export const ROOT_FOLDER_VALUE = "__root__";

export function parseFolderSelectValue(value: string): string | null {
  return value === ROOT_FOLDER_VALUE || value === "" ? null : value;
}
