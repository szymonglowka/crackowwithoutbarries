import { api } from './client.js'

export const getMeta = () => api('/meta/')
export const getSources = () => api('/sources/')
