const SOURCE_LINE = /^Sources?:\s*(.*)$/i
const NOTE_PREFIX = /^Please note:/i
const LABEL_ITEM = /^([^:]+):\s+(.+)$/

const parseListItem = (line) => {
  const labelMatch = line.match(LABEL_ITEM)
  if (labelMatch && labelMatch[1].length < 56) {
    return { label: labelMatch[1].trim(), text: labelMatch[2].trim() }
  }
  return { text: line }
}

const splitParagraph = (paragraph) => {
  const lines = paragraph.split('\n').map((line) => line.trim()).filter(Boolean)
  if (lines.length === 0) return []
  if (lines.length === 1) {
    if (NOTE_PREFIX.test(lines[0])) return [{ type: 'note', text: lines[0] }]
    return [{ type: 'paragraph', text: lines[0] }]
  }

  const noteIndex = lines.findIndex((line) => NOTE_PREFIX.test(line))
  const noteLine = noteIndex >= 0 ? lines[noteIndex] : null
  const contentLines = noteIndex >= 0 ? lines.filter((_, i) => i !== noteIndex) : lines

  const blocks = []
  const [firstLine, ...rest] = contentLines

  if (rest.length === 0) {
    blocks.push({ type: 'paragraph', text: firstLine })
  } else if (firstLine.endsWith(':')) {
    blocks.push({ type: 'paragraph', text: firstLine })
    blocks.push({ type: 'list', items: rest.map(parseListItem) })
  } else {
    blocks.push({ type: 'list', items: contentLines.map(parseListItem) })
  }

  if (noteLine) blocks.push({ type: 'note', text: noteLine })
  return blocks
}

/**
 * Parse plain-text FAQ answers into render blocks:
 * paragraphs, bullet lists, labelled items, notes, and source citations.
 */
export function parseFaqAnswer(raw) {
  if (!raw?.trim()) return []

  const paragraphs = raw.split(/\n\n+/).map((p) => p.trim()).filter(Boolean)
  const blocks = []

  for (const paragraph of paragraphs) {
    const lines = paragraph.split('\n').map((line) => line.trim()).filter(Boolean)
    const firstLine = lines[0] || ''
    const sourceMatch = firstLine.match(SOURCE_LINE)

    if (sourceMatch) {
      const inlineSource = sourceMatch[1]?.trim()
      const sourceItems = [
        ...(inlineSource ? [inlineSource] : []),
        ...lines.slice(1)
      ].filter(Boolean)

      blocks.push({
        type: 'sources',
        heading: firstLine.startsWith('Sources') ? 'Sources' : 'Source',
        items: sourceItems
      })
      continue
    }

    blocks.push(...splitParagraph(paragraph))
  }

  return blocks.filter((block) => {
    if (block.type === 'paragraph' || block.type === 'note') return Boolean(block.text)
    if (block.type === 'list' || block.type === 'sources') return block.items?.length
    return true
  })
}
