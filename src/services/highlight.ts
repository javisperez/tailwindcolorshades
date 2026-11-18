const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

// Only plain hex / oklch() values get a color dot; the pattern keeps the inline style safe.
const COLOR_VALUE = /^(#[0-9a-f]{3,8}|oklch\([\d.\s%-]+\))$/i

const dot = (value: string) =>
  COLOR_VALUE.test(value) ? `<i class="tok-dot" style="background:${value}"></i>` : ''

function highlightLine(line: string): string {
  // v4: --color-indigo-500: oklch(0.58 0.2 277);
  let match = line.match(/^(\s*)(--color-[\w.-]+)(:\s*)(.+?)(;)$/)
  if (match) {
    const [, indent, name, colon, value, semicolon] = match
    return `${indent}<span class="tok-var">${escapeHtml(name)}</span>${colon}${dot(value)}<span class="tok-val">${escapeHtml(value)}</span>${semicolon}`
  }

  // v3: '500': '#6366f1',
  match = line.match(/^(\s*)'(\d+)'(:\s*)'(.+?)'(,?)$/)
  if (match) {
    const [, indent, step, colon, value, comma] = match
    return `${indent}<span class="tok-key">'${escapeHtml(step)}'</span>${colon}'${dot(value)}<span class="tok-val">${escapeHtml(value)}</span>'${comma}`
  }

  // v3: 'indigo': {
  match = line.match(/^(\s*)'([^']+)'(:\s*\{)$/)
  if (match) {
    const [, indent, name, rest] = match
    return `${indent}<span class="tok-var">'${escapeHtml(name)}'</span>${rest}`
  }

  return escapeHtml(line)
}

/**
 * Turns the generated Tailwind config into HTML with color dots and light syntax coloring.
 * Every piece of user-controlled text (palette names, values) is escaped.
 */
export function highlightConfig(source: string): string {
  return source.split('\n').map(highlightLine).join('\n')
}
