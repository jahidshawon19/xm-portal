import katex from 'katex'

export function cleanText(text) {
  if (!text) return ''
  return text.replace(/\n/g, ' ').replace(/ {2,}/g, ' ').trim()
}

function katexRender(latex, displayMode) {
  try {
    return katex.renderToString(latex.trim(), { throwOnError: false, output: 'html', displayMode })
  } catch {
    return `<code>${latex}</code>`
  }
}

export function renderExplanation(text) {
  if (!text) return ''
  // Replace \[...\] display math
  let out = text.replace(/\\\[(.+?)\\\]/gs, (_, latex) => katexRender(latex, true))
  // Replace \(...\) inline math
  out = out.replace(/\\\((.+?)\\\)/gs, (_, latex) => katexRender(latex, false))
  return out
}
