const ALLOWED_TAGS = new Set([
  'p', 'br', 'b', 'strong', 'i', 'em',
  'ul', 'ol', 'li', 'blockquote', 'code', 'pre', 'a',
])

export function sanitize(html: string): DocumentFragment {
  const doc = new DOMParser().parseFromString(html, 'text/html')
  const frag = document.createDocumentFragment()
  transfer(doc.body, frag)
  return frag
}

function transfer(src: Node, dest: Node): void {
  for (const child of Array.from(src.childNodes)) {
    if (child.nodeType === Node.TEXT_NODE) {
      dest.appendChild(child.cloneNode())
    } else if (child.nodeType === Node.ELEMENT_NODE) {
      const el = child as Element
      const tag = el.tagName.toLowerCase()
      if (ALLOWED_TAGS.has(tag)) {
        const out = document.createElement(tag)
        if (tag === 'a') {
          const href = el.getAttribute('href') ?? ''
          try {
            const parsed = new URL(href)
            if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
              out.setAttribute('href', href)
              out.setAttribute('target', '_blank')
              out.setAttribute('rel', 'noopener noreferrer')
            }
          } catch { /* drop href if invalid */ }
        }
        transfer(el, out)
        dest.appendChild(out)
      } else {
        // disallowed element - still include its text content
        transfer(el, dest)
      }
      // all attributes (on*, style, class, etc.) are dropped; only href on <a> is set above
    }
    // comments and other node types are dropped
  }
}
