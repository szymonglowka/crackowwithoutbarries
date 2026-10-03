// OWNER: A2. Contract: docs/API.md#route
import { api } from './client.js'

export const getRoute = ({ from, to, profile, avoid }) =>
  api('/route/', {
    params: { from: from.join(','), to: to.join(','), ...profile, avoid: avoid?.join(',') },
  })

export const geocode = (q) => api('/geocode/', { params: { q } })
