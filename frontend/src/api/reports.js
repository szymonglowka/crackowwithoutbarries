// OWNER: A4 (frontend) / A1 (backend endpoint). Contract: docs/API.md#reports
import { api } from './client.js'

export const createReport = (data) => api('/reports/', { method: 'POST', body: JSON.stringify(data) })
