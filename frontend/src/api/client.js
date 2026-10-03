// Thin fetch wrapper. All endpoints are documented in docs/API.md.
export class ApiError extends Error {
  constructor(status, body) {
    super(`API ${status}`)
    this.status = status
    this.body = body
  }
}

export async function api(path, { params, ...init } = {}) {
  const qs = params ? `?${new URLSearchParams(clean(params))}` : ''
  const res = await fetch(`/api${path}${qs}`, {
    headers: { 'Content-Type': 'application/json', ...init.headers },
    ...init,
  })
  const body = res.headers.get('content-type')?.includes('json') ? await res.json() : null
  if (!res.ok) throw new ApiError(res.status, body)
  return body
}

function clean(params) {
  return Object.fromEntries(
    Object.entries(params)
      .filter(([, v]) => v !== undefined && v !== null && v !== '')
      .map(([k, v]) => [k, typeof v === 'boolean' ? (v ? '1' : '0') : String(v)]),
  )
}
