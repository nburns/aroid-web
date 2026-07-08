export async function pingFeed(url: string): Promise<'ok' | 'unreachable'> {
  try {
    await fetch(url, { mode: 'no-cors', signal: AbortSignal.timeout(5000) })
    return 'ok'
  } catch (err) {
    if (err instanceof TypeError) {
      return 'unreachable'
    }
    throw err
  }
}

export function loadArtwork(url: string, imgEl: HTMLImageElement): Promise<boolean> {
  return new Promise((resolve) => {
    imgEl.onload = () => resolve(true)
    imgEl.onerror = () => resolve(false)
    imgEl.src = url
  })
}
