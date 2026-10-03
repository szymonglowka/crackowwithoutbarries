// Catalog of parameters, statuses, categories and profile presets from /api/meta/.
// Fetched once and cached for the whole session.
import { useEffect, useState } from 'react'
import { getMeta } from '../api/meta.js'

let cache = null
let pending = null

export function useMeta() {
  const [meta, setMeta] = useState(cache)
  useEffect(() => {
    if (cache) return
    pending ??= getMeta().then((m) => (cache = m))
    pending.then(setMeta).catch(() => (pending = null))
  }, [])
  return meta
}
