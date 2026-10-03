// OWNER: A3 (may extend). Profile values are sent as query params - see docs/API.md
import { api } from './client.js'

export const searchPlaces = ({ q, category, profile, ...rest } = {}) =>
  api('/places/', { params: { q, category, ...profile, ...rest } })

export const getPlace = (id, profile) => api(`/places/${id}/`, { params: profile })

export const getPlaceHistory = (id) => api(`/places/${id}/history/`)
