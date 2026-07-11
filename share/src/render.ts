import m from 'mithril'
import type { SharePayload, EpisodePayload } from './types'
import { sanitize } from './sanitize'

export type ShareState =
  | { status: 'loading' }
  | { status: 'error', message: string }
  | {
      status: 'ready',
      payload: SharePayload,
      artworkReady: boolean,
      feedUnreachable: boolean,
    }

function safeHref(url: string): string {
  try {
    const parsed = new URL(url)
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') return url
  } catch { /* fall through */ }
  return '#'
}

const RSS_ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
  <path d="M6.18 15.64a2.18 2.18 0 0 1 2.18 2.18C8.36 19.01 7.38 20 6.18 20 4.98 20 4 19.01 4 17.82a2.18 2.18 0 0 1 2.18-2.18M4 4.44A15.56 15.56 0 0 1 19.56 20h-2.83A12.73 12.73 0 0 0 4 7.27V4.44m0 5.66a9.9 9.9 0 0 1 9.9 9.9h-2.83A7.07 7.07 0 0 0 4 13.07V10.1z"/>
</svg>`

function formatDuration(seconds: number): string {
  const total = Math.round(seconds)
  const h = Math.floor(total / 3600)
  const min = Math.floor((total % 3600) / 60)
  if (h > 0) return min > 0 ? `${h}h ${min}m` : `${h}h`
  if (min > 0) return `${min}m`
  return `${total}s`
}

function formatDate(iso: string): string | null {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return null
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

function deepLinkHref(payload: SharePayload): string {
  const params = new URLSearchParams({ feed: payload.u })
  if (payload.e) params.set('episode', payload.e.t)
  return `aroid://open?${params.toString()}`
}

const EpisodeView: m.Component<{ episode: EpisodePayload }> = {
  view({ attrs: { episode } }) {
    const metaParts: string[] = []
    if (episode.p) {
      const dateStr = formatDate(episode.p)
      if (dateStr) metaParts.push(dateStr)
    }
    if (typeof episode.dur === 'number') metaParts.push(formatDuration(episode.dur))

    return m('section.share-episode', [
      m('h2.share-episode-title', episode.t),
      metaParts.length > 0 ? m('p.share-episode-meta', metaParts.join(' · ')) : null,
      m('.share-episode-desc', {
        oncreate: (vnode: m.VnodeDOM) => {
          vnode.dom.appendChild(sanitize(episode.d))
        },
        onbeforeupdate: () => false,
      }),
    ])
  },
}

const CardView: m.Component<{
  payload: SharePayload,
  artworkReady: boolean,
  feedUnreachable: boolean,
  onArtworkLoad: () => void,
}> = {
  view({ attrs: { payload, artworkReady, feedUnreachable, onArtworkLoad } }) {
    return m('.share-card', [
      m('h1.share-feed-title', payload.f),

      payload.e
        ? m('img.share-artwork', {
            alt: payload.f,
            hidden: !artworkReady,
            src: payload.e.a,
            onload: onArtworkLoad,
          })
        : null,

      m('a.share-open-btn', { href: deepLinkHref(payload) }, 'Listen in Aroid'),

      m('a.share-rss-link', {
        href: safeHref(payload.u),
        target: '_blank',
        rel: 'noopener',
      }, [
        m.trust(RSS_ICON_SVG),
        ' RSS Feed',
      ]),

      feedUnreachable
        ? m('.share-unreachable', 'Feed could not be reached — it may be offline or unavailable.')
        : null,

      payload.e ? m(EpisodeView, { episode: payload.e }) : null,
    ])
  },
}

export const ShareView: m.Component<{
  state: ShareState,
  onArtworkLoad: () => void,
}> = {
  view({ attrs: { state, onArtworkLoad } }) {
    if (state.status === 'loading') {
      return m('.share-loading', 'Loading…')
    }
    if (state.status === 'error') {
      return m('.share-error', state.message)
    }
    return m(CardView, {
      payload: state.payload,
      artworkReady: state.artworkReady,
      feedUnreachable: state.feedUnreachable,
      onArtworkLoad,
    })
  },
}
