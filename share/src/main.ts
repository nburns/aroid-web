import { decode } from './codec'
import { pingFeed, loadArtwork } from './validate'
import { renderLoading, renderError, renderCard, renderUnreachable } from './render'

document.addEventListener('DOMContentLoaded', () => {
  const root = document.getElementById('share-root')
  if (!root) return

  renderLoading(root)

  decode(window.location.hash)
    .then((payload) => {
      const imgEl = renderCard(payload, root)

      const feedPing = pingFeed(payload.u).then((status) => {
        if (status === 'unreachable') {
          renderUnreachable(root)
        }
      })

      const artworkLoad = imgEl && payload.e
        ? loadArtwork(payload.e.a, imgEl).then((ok) => {
            if (ok) {
              imgEl.hidden = false
            }
          })
        : Promise.resolve()

      return Promise.all([feedPing, artworkLoad])
    })
    .catch((err: unknown) => {
      const message = err instanceof Error ? err.message : 'Failed to load share link.'
      renderError(message, root)
    })
})
