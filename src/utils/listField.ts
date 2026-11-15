/** Split stored list text into editable items (supports `- `, `* `, `• `, numbered). */
export function parseListItems(text: string): string[] {
  const raw = text.replace(/\r\n/g, '\n').trim()
  if (!raw) return ['']

  const lines = raw
    .split('\n')
    .map((line) =>
      line
        .replace(/^\s*(?:[-*•]|\d+[.)])\s+/, '')
        .trim(),
    )
    .filter((line) => line.length > 0)

  return lines.length > 0 ? lines : [raw]
}

/** Persist list items as markdown-style bullets. */
export function joinListItems(items: string[]): string {
  return items
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => `- ${item}`)
    .join('\n')
}
