import { unzlib } from 'fflate'
import type { SharePayload } from './types'

function base64urlToBytes(b64url: string): Uint8Array {
  const b64 = b64url.replace(/-/g, '+').replace(/_/g, '/')
  const binary = atob(b64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}

async function decompressNative(bytes: Uint8Array): Promise<string> {
  const ds = new DecompressionStream('deflate')
  const writer = ds.writable.getWriter()
  writer.write(bytes)
  writer.close()
  const chunks: Uint8Array[] = []
  const reader = ds.readable.getReader()
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    chunks.push(value)
  }
  const total = chunks.reduce((n, c) => n + c.length, 0)
  const out = new Uint8Array(total)
  let offset = 0
  for (const chunk of chunks) {
    out.set(chunk, offset)
    offset += chunk.length
  }
  return new TextDecoder().decode(out)
}

function decompressFallback(bytes: Uint8Array): Promise<string> {
  return new Promise((resolve, reject) => {
    unzlib(bytes, (err, data) => {
      if (err) {
        reject(new Error(`fflate decompression failed: ${err.message}`))
      } else {
        resolve(new TextDecoder().decode(data))
      }
    })
  })
}

async function decompress(bytes: Uint8Array): Promise<string> {
  try {
    return await decompressNative(bytes)
  } catch {
    return decompressFallback(bytes)
  }
}

function assertHttpUrl(value: string, label: string): void {
  let parsed: URL
  try {
    parsed = new URL(value)
  } catch {
    throw new Error(`${label} is not a valid URL`)
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error(`${label} must use http or https (got ${parsed.protocol})`)
  }
}

function isSharePayload(v: unknown): v is SharePayload {
  if (typeof v !== 'object' || v === null) return false
  const obj = v as Record<string, unknown>
  if (typeof obj['f'] !== 'string' || obj['f'] === '') return false
  if (typeof obj['u'] !== 'string' || obj['u'] === '') return false
  if ('e' in obj && obj['e'] !== undefined) {
    const e = obj['e']
    if (typeof e !== 'object' || e === null) return false
    const ep = e as Record<string, unknown>
    if (typeof ep['t'] !== 'string') return false
    if (typeof ep['d'] !== 'string') return false
    if (typeof ep['a'] !== 'string') return false
  }
  return true
}

export async function decode(fragment: string): Promise<SharePayload> {
  const hash = fragment.startsWith('#') ? fragment.slice(1) : fragment
  const params = new URLSearchParams(hash)
  const p = params.get('p')
  if (p === null || p === '') {
    throw new Error('Missing required parameter: p')
  }

  let bytes: Uint8Array
  try {
    bytes = base64urlToBytes(p)
  } catch {
    throw new Error('Invalid base64url encoding in parameter p')
  }

  let json: string
  try {
    json = await decompress(bytes)
  } catch {
    throw new Error('Decompression failed - payload may be corrupted')
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(json)
  } catch {
    throw new Error('Invalid JSON in payload')
  }

  if (!isSharePayload(parsed)) {
    throw new Error('Payload missing required fields: f (feed name) and u (feed URL) must be non-empty strings')
  }

  assertHttpUrl(parsed.u, 'Feed URL (u)')

  if (parsed.e) {
    assertHttpUrl(parsed.e.a, 'Artwork URL (e.a)')
  }

  return parsed
}
