import type { SharePayload } from './types'
import { sanitize } from './sanitize'

function safeHref(url: string): string {
  try {
    const parsed = new URL(url)
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') return url
  } catch { /* fall through */ }
  return '#'
}

const RSS_ICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
  <path d="M6.18 15.64a2.18 2.18 0 0 1 2.18 2.18C8.36 19.01 7.38 20 6.18 20 4.98 20 4 19.01 4 17.82a2.18 2.18 0 0 1 2.18-2.18M4 4.44A15.56 15.56 0 0 1 19.56 20h-2.83A12.73 12.73 0 0 0 4 7.27V4.44m0 5.66a9.9 9.9 0 0 1 9.9 9.9h-2.83A7.07 7.07 0 0 0 4 13.07V10.1z"/>
</svg>`

export function renderLoading(el: HTMLElement): void {
  el.innerHTML = ''
  const div = document.createElement('div')
  div.className = 'share-loading'
  div.textContent = 'Loading…'
  el.appendChild(div)
}

export function renderError(message: string, el: HTMLElement): void {
  el.innerHTML = ''
  const div = document.createElement('div')
  div.className = 'share-error'
  div.textContent = message
  el.appendChild(div)
}

function formatDuration(seconds: number): string {
  const total = Math.round(seconds)
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  if (h > 0) return m > 0 ? `${h}h ${m}m` : `${h}h`
  if (m > 0) return `${m}m`
  return `${total}s`
}

function formatDate(iso: string): string | null {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return null
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

export function renderCard(payload: SharePayload, el: HTMLElement): HTMLImageElement | null {
  el.innerHTML = ''

  const card = document.createElement('div')
  card.className = 'share-card'

  // Feed title
  const feedTitle = document.createElement('h1')
  feedTitle.className = 'share-feed-title'
  feedTitle.textContent = payload.f
  card.appendChild(feedTitle)

  // Artwork (from episode payload)
  let imgEl: HTMLImageElement | null = null
  if (payload.e) {
    const img = document.createElement('img')
    img.className = 'share-artwork'
    img.alt = payload.f
    img.hidden = true
    card.appendChild(img)
    imgEl = img
  }

  // Open in Aroid button
  const openBtn = document.createElement('a')
  openBtn.className = 'share-open-btn'
  const deepParams = new URLSearchParams({ feed: payload.u })
  if (payload.e) deepParams.set('episode', payload.e.t)
  openBtn.href = `aroid://open?${deepParams.toString()}`
  openBtn.textContent = 'Open in Aroid'
  card.appendChild(openBtn)

  // RSS feed link
  const rssLink = document.createElement('a')
  rssLink.className = 'share-rss-link'
  rssLink.href = safeHref(payload.u)
  rssLink.target = '_blank'
  rssLink.rel = 'noopener'
  // safe: RSS_ICON is a static string we control, not user data
  rssLink.innerHTML = RSS_ICON
  const rssText = document.createTextNode(' RSS Feed')
  rssLink.appendChild(rssText)
  card.appendChild(rssLink)

  // Episode section (nested card)
  if (payload.e) {
    const epCard = document.createElement('section')
    epCard.className = 'share-episode'

    const epTitle = document.createElement('h2')
    epTitle.className = 'share-episode-title'
    epTitle.textContent = payload.e.t
    epCard.appendChild(epTitle)

    const metaParts: string[] = []
    if (payload.e.p) {
      const dateStr = formatDate(payload.e.p)
      if (dateStr) metaParts.push(dateStr)
    }
    if (typeof payload.e.dur === 'number') metaParts.push(formatDuration(payload.e.dur))
    if (metaParts.length > 0) {
      const meta = document.createElement('p')
      meta.className = 'share-episode-meta'
      meta.textContent = metaParts.join(' · ')
      epCard.appendChild(meta)
    }

    const epDesc = document.createElement('div')
    epDesc.className = 'share-episode-desc'
    epDesc.appendChild(sanitize(payload.e.d))
    epCard.appendChild(epDesc)

    card.appendChild(epCard)
  }

  // Unreachable notice placeholder (appended later if needed)
  el.appendChild(card)
  return imgEl
}

export function renderUnreachable(el: HTMLElement): void {
  const card = el.querySelector('.share-card')
  if (!card || card.querySelector('.share-unreachable')) return
  const div = document.createElement('div')
  div.className = 'share-unreachable'
  div.textContent = 'Feed could not be reached — it may be offline or unavailable.'
  const rssLink = card.querySelector('.share-rss-link')
  if (rssLink) {
    rssLink.after(div)
  } else {
    card.appendChild(div)
  }
}
