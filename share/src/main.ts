import m from 'mithril'
import { decode } from './codec'
import { pingFeed } from './validate'
import { ShareView, type ShareState } from './render'

document.addEventListener('DOMContentLoaded', () => {
  const root = document.getElementById('share-root')
  if (!root) return

  let state: ShareState = { status: 'loading' }

  const onArtworkLoad = () => {
    if (state.status === 'ready') {
      state.artworkReady = true
      m.redraw()
    }
  }

  m.mount(root, {
    view: () => m(ShareView, { state, onArtworkLoad }),
  })

  decode(window.location.hash)
    .then((payload) => {
      state = {
        status: 'ready',
        payload,
        artworkReady: false,
        feedUnreachable: false,
      }
      m.redraw()

      pingFeed(payload.u).then((s) => {
        if (s === 'unreachable' && state.status === 'ready') {
          state.feedUnreachable = true
          m.redraw()
        }
      })
    })
    .catch((err: unknown) => {
      const message = err instanceof Error ? err.message : 'Failed to load share link.'
      state = { status: 'error', message }
      m.redraw()
    })
})
