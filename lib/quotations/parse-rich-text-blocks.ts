export type RichTextListItem = {
  text: string;
  children: RichTextListItem[];
};

export type RichTextBlock =
  | { type: "paragraph"; lines: string[] }
  | { type: "bullet"; items: RichTextListItem[] }
  | { type: "numbered"; items: RichTextListItem[] };

const BULLET_LINE = /^[-*•]\s+(.+)$/;
const NUMBERED_LINE = /^\d+[.)]\s+(.+)$/;
const MAX_LIST_DEPTH = 4;

function listIndentLevel(rawLine: string): number {
  const leading = rawLine.match(/^[\t ]*/)?.[0] ?? "";
  let spaces = 0;
  for (const ch of leading) {
    spaces += ch === "\t" ? 2 : 1;
  }
  return Math.min(MAX_LIST_DEPTH, Math.floor(spaces / 2));
}

function appendListItem(
  items: RichTextListItem[],
  level: number,
  text: string,
): void {
  const node: RichTextListItem = { text, children: [] };
  if (level <= 0) {
    items.push(node);
    return;
  }

  let parentList = items;
  for (let l = 0; l < level; l++) {
    if (parentList.length === 0) {
      items.push(node);
      return;
    }
    const parent = parentList[parentList.length - 1]!;
    if (l === level - 1) {
      parent.children.push(node);
      return;
    }
    parentList = parent.children;
  }
}

/** Convierte texto plano en párrafos y listas (viñetas o numeradas, con sub-niveles por indentación). */
export function parseRichTextBlocks(text: string): RichTextBlock[] {
  const lines = text.split(/\r?\n/);
  const blocks: RichTextBlock[] = [];
  let current: RichTextBlock | null = null;

  function flush() {
    if (current) {
      blocks.push(current);
      current = null;
    }
  }

  for (const rawLine of lines) {
    const trimmed = rawLine.trim();
    if (!trimmed) {
      flush();
      continue;
    }

    const bulletMatch = trimmed.match(BULLET_LINE);
    if (bulletMatch?.[1]) {
      if (current?.type !== "bullet") {
        flush();
        current = { type: "bullet", items: [] };
      }
      appendListItem(current.items, listIndentLevel(rawLine), bulletMatch[1]);
      continue;
    }

    const numberedMatch = trimmed.match(NUMBERED_LINE);
    if (numberedMatch?.[1]) {
      if (current?.type !== "numbered") {
        flush();
        current = { type: "numbered", items: [] };
      }
      appendListItem(current.items, listIndentLevel(rawLine), numberedMatch[1]);
      continue;
    }

    if (current?.type !== "paragraph") {
      flush();
      current = { type: "paragraph", lines: [] };
    }
    current.lines.push(trimmed);
  }

  flush();
  return blocks;
}
