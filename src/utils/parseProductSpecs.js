const INDICATIONS_HEADING = /^Common Indications:?$/i

/**
 * Split product specifications text into general specs and Common Indications.
 * @param {string | null | undefined} text
 * @returns {{ specs: string[], indications: string[] }}
 */
export const parseProductSpecs = (text) => {
  const lines = String(text || '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)

  const headingIndex = lines.findIndex((line) => INDICATIONS_HEADING.test(line))
  if (headingIndex < 0) {
    return { specs: lines, indications: [] }
  }

  return {
    specs: lines.slice(0, headingIndex),
    indications: lines.slice(headingIndex + 1),
  }
}
