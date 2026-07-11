export interface EpisodePayload {
  t: string
  d: string
  a: string
  p?: string
  dur?: number
}

export interface SharePayload {
  f: string
  u: string
  e?: EpisodePayload
}
