/**
 * Pretty-print compact Python expressions used as source `output` / action `result`.
 *
 * Strategy: expand dict `{...}` entries onto their own lines; keep calls / lists compact
 * unless a nested value is itself a multi-key dict.
 */

function splitTopLevel(src: string, open: string, close: string): string[] | null {
  if (!src.startsWith(open) || !src.endsWith(close)) return null
  const inner = src.slice(1, -1).trim()
  if (!inner) return []

  const parts: string[] = []
  let buf = ''
  let depthParen = 0
  let depthBracket = 0
  let depthBrace = 0
  let inStr: "'" | '"' | null = null
  let escape = false

  for (let i = 0; i < inner.length; i += 1) {
    const ch = inner[i]

    if (inStr) {
      buf += ch
      if (escape) escape = false
      else if (ch === '\\') escape = true
      else if (ch === inStr) inStr = null
      continue
    }

    if (ch === "'" || ch === '"') {
      inStr = ch
      buf += ch
      continue
    }

    if (ch === '(') depthParen += 1
    else if (ch === ')') depthParen = Math.max(0, depthParen - 1)
    else if (ch === '[') depthBracket += 1
    else if (ch === ']') depthBracket = Math.max(0, depthBracket - 1)
    else if (ch === '{') depthBrace += 1
    else if (ch === '}') depthBrace = Math.max(0, depthBrace - 1)

    if (ch === ',' && depthParen === 0 && depthBracket === 0 && depthBrace === 0) {
      parts.push(buf.trim())
      buf = ''
      continue
    }

    buf += ch
  }

  if (buf.trim()) parts.push(buf.trim())
  return parts
}

function splitDictEntry(entry: string): { key: string; value: string } | null {
  let depthParen = 0
  let depthBracket = 0
  let depthBrace = 0
  let inStr: "'" | '"' | null = null
  let escape = false

  for (let i = 0; i < entry.length; i += 1) {
    const ch = entry[i]

    if (inStr) {
      if (escape) escape = false
      else if (ch === '\\') escape = true
      else if (ch === inStr) inStr = null
      continue
    }

    if (ch === "'" || ch === '"') {
      inStr = ch
      continue
    }

    if (ch === '(') depthParen += 1
    else if (ch === ')') depthParen = Math.max(0, depthParen - 1)
    else if (ch === '[') depthBracket += 1
    else if (ch === ']') depthBracket = Math.max(0, depthBracket - 1)
    else if (ch === '{') depthBrace += 1
    else if (ch === '}') depthBrace = Math.max(0, depthBrace - 1)

    if (ch === ':' && depthParen === 0 && depthBracket === 0 && depthBrace === 0) {
      return {
        key: entry.slice(0, i).trim(),
        value: entry.slice(i + 1).trim(),
      }
    }
  }
  return null
}

function softenOperators(expr: string): string {
  return expr
    .replace(/\s*==\s*/g, ' == ')
    .replace(/\s*!=\s*/g, ' != ')
    .replace(/\s+and\s+/g, ' and ')
    .replace(/\s+or\s+/g, ' or ')
    .replace(/\s+,/g, ',')
    .replace(/,(?!\s|$)/g, ', ')
    .replace(/\s+/g, ' ')
    .trim()
}

function formatValue(value: string, indent: number, indentSize: number): string {
  const trimmed = value.trim()
  if (!trimmed) return trimmed

  // Nested multi-entry dict → recurse
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    const parts = splitTopLevel(trimmed, '{', '}')
    if (parts && parts.length >= 1 && parts.some((p) => splitDictEntry(p))) {
      return formatDict(trimmed, indent, indentSize)
    }
  }

  return softenOperators(trimmed)
}

function formatDict(src: string, indent: number, indentSize: number): string {
  const parts = splitTopLevel(src.trim(), '{', '}')
  if (!parts) return src.trim()
  if (parts.length === 0) return '{}'

  const pad = ' '.repeat(indent * indentSize)
  const innerPad = ' '.repeat((indent + 1) * indentSize)
  const lines = parts.map((part) => {
    const entry = splitDictEntry(part)
    if (!entry) return `${innerPad}${softenOperators(part)}`
    const formattedVal = formatValue(entry.value, indent + 1, indentSize)
    // If nested dict spans multiple lines, keep value on following structure
    if (formattedVal.includes('\n')) {
      return `${innerPad}${entry.key}: ${formattedVal}`
    }
    return `${innerPad}${entry.key}: ${formattedVal}`
  })

  return `{\n${lines.join(',\n')},\n${pad}}`
}

export function formatPythonExpression(input: string, indentSize = 2): string {
  const src = input.replace(/\r\n/g, '\n').trim()
  if (!src) return ''

  // Already multi-line with indentation — leave as authored
  if (/\n\s+\S/.test(src)) return src.endsWith('\n') ? src : `${src}\n`

  let formatted: string
  if (src.startsWith('{') && src.endsWith('}')) {
    formatted = formatDict(src, 0, indentSize)
  } else {
    formatted = softenOperators(src)
  }

  return formatted.endsWith('\n') ? formatted : `${formatted}\n`
}
