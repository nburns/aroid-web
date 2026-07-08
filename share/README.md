# Aroid Share URL Format

## 1. Full URL structure

```
https://aroidpod.com/share/#p=<base64url(zlib(json))>
```

The payload lives entirely in the URL fragment (`#...`), so it is never sent to the server.

Example (feed-only):

```
https://aroidpod.com/share/#p=eJyrViqpLEgtLk5NSSxJLUpVslIqLU4tykvMTQUA6OwHpA==
```

Example (with episode):

```
https://aroidpod.com/share/#p=eJyrViqpLEgtLk5NSSxJLUpVslIqS8wpTgUA6fQLmQ==
```

## 2. JSON schema

The raw JSON before compression:

```json
{
  "f": "Feed Name",
  "u": "https://feeds.example.com/podcast.xml",
  "e": {
    "t": "Episode Title",
    "d": "Episode description text, truncated to ~500 characters recommended.",
    "a": "https://example.com/artwork.jpg"
  }
}
```

| Field | Type   | Required | Notes |
|-------|--------|----------|-------|
| `f`   | string | yes      | Display name of the podcast feed |
| `u`   | string | yes      | Feed URL; must be a valid absolute URL |
| `e`   | object | no       | Omit entirely for a feed-only share |
| `e.t` | string | yes (if `e` present) | Episode title |
| `e.d` | string | yes (if `e` present) | Episode description; truncate to ~500 chars to keep URL short |
| `e.a` | string | yes (if `e` present) | Artwork image URL |

## 3. Swift encoding snippet

```swift
import Foundation

func makeShareURL(feedName: String, feedURL: String,
                  episodeTitle: String? = nil,
                  episodeDesc: String? = nil,
                  artworkURL: String? = nil) throws -> URL {
    var payload: [String: Any] = ["f": feedName, "u": feedURL]
    if let t = episodeTitle, let d = episodeDesc, let a = artworkURL {
        payload["e"] = ["t": t, "d": String(d.prefix(500)), "a": a]
    }
    let json = try JSONSerialization.data(withJSONObject: payload)
    let compressed = try (json as NSData).compressed(using: .zlib) as Data
    let b64 = compressed.base64EncodedString()
        .replacingOccurrences(of: "+", with: "-")
        .replacingOccurrences(of: "/", with: "_")
        .trimmingCharacters(in: CharacterSet(charactersIn: "="))
    return URL(string: "https://aroidpod.com/share/#p=\(b64)")!
}
```

## 4. JS decoding snippet

```js
async function decodeShareURL(fragment) {
  const params = new URLSearchParams(fragment.replace(/^#/, ''))
  const b64url = params.get('p')
  const b64 = b64url.replace(/-/g, '+').replace(/_/g, '/')
  const bytes = Uint8Array.from(atob(b64), c => c.charCodeAt(0))

  // decompress
  const ds = new DecompressionStream('deflate')
  const writer = ds.writable.getWriter()
  writer.write(bytes)
  writer.close()
  const buf = await new Response(ds.readable).arrayBuffer()
  return JSON.parse(new TextDecoder().decode(buf))
}
```

## 5. Why zlib RFC 1950

`NSData.compressed(using: .zlib)` produces RFC 1950 zlib-wrapped deflate (2-byte header `78 9C`, Adler-32 trailer). The browser `DecompressionStream('deflate')` format accepts RFC 1950 zlib, making the two sides directly compatible without any post-processing. Raw deflate (`DecompressionStream('deflate-raw')`) would require stripping the zlib wrapper on the Swift side, which adds friction for no benefit.

Safari added `DecompressionStream` in version 16.4 (March 2023). For older Safari, the bundle falls back to `fflate`'s `unzlib`, which handles the same RFC 1950 format.

## 6. Validation behavior

When the share page loads it:

1. Decodes and parses the payload (structural validation).
2. Verifies `u` is a valid absolute URL (`new URL(payload.u)`).
3. Fires a `no-cors` fetch ping to `payload.u` with a 5-second timeout. If the request throws a `TypeError` (network failure), it shows a "feed unreachable" warning alongside the share card.
4. If an episode is present, sets `<img src>` to `payload.e.a`. If the image fails to load it is simply hidden rather than shown broken.

Validation errors at steps 1-2 replace the entire share card with an error message. Steps 3-4 failures are non-fatal UI hints.

## 7. Feed-only vs episode share examples

**Feed-only** - no `e` field:

```json
{"f":"Accidental Tech Podcast","u":"https://atp.fm/episodes?format=rss"}
```

**Episode share** - full `e` object:

```json
{
  "f": "Accidental Tech Podcast",
  "u": "https://atp.fm/episodes?format=rss",
  "e": {
    "t": "Episode 573: Gratuitous Headline Features",
    "d": "Marco, Casey, and John discuss WWDC, the new Mac Pro, and why nobody asked for that.",
    "a": "https://atp.fm/artwork/atp-artwork.jpg"
  }
}
```

To generate the encoded URL for either: serialize to JSON (no extra whitespace), zlib-compress, base64url-encode, and append as the `p` fragment parameter per the Swift snippet above.
