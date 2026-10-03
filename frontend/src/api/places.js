// OWNER: A3 (may extend). Profile values are sent as query params - see docs/API.md
import { api } from './client.js'

export const searchPlaces = ({ q, category, profile, ordering, near } = {}) =>
  api('/places/', { params: { q, category, ...profile, ordering, near } })

export const getPlace = (id, profile) => api(`/places/${id}/`, { params: profile })

// A1 builds /history/ later - callers must handle 404 gracefully.
export const getPlaceHistory = (id) => api(`/places/${id}/history/`)

/** Client-side fallback sort (backend `ordering` lands with A1). */
export function sortResults(results, ordering) {
  const list = [...(results ?? [])]
  if (ordering === 'documented') {
    list.sort((a, b) => (b.summary?.confirmed ?? 0) - (a.summary?.confirmed ?? 0))
  } else if (ordering === 'distance') {
    list.sort((a, b) => (a.distance_m ?? Infinity) - (b.distance_m ?? Infinity))
  } else {
    list.sort((a, b) =>
      (a.summary?.barrier ?? 0) - (b.summary?.barrier ?? 0) ||
      (b.summary?.match ?? 0) - (a.summary?.match ?? 0),
    )
  }
  return list
}
