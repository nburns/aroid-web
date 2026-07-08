export interface EpisodePayload {
  t: string
  d: string
  a: string
}

export interface SharePayload {
  f: string
  u: string
  e?: EpisodePayload
}
