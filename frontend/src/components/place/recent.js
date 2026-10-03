// OWNER: A3. "Ostatnio oglądane" + offline copies of place cards.
// Stored ONLY in localStorage: id, name, date and the full detail JSON.
const KEY = 'bezprogu.recent'
const MAX = 10

export function getRecent() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) ?? []
  } catch {
    return []
  }
}

export function saveRecent(place) {
  try {
    const entry = {
      id: place.id,
      name: place.name,
      address: place.address,
      date: new Date().toISOString().slice(0, 10),
      json: place,
    }
    const rest = getRecent().filter((e) => e.id !== place.id)
    localStorage.setItem(KEY, JSON.stringify([entry, ...rest].slice(0, MAX)))
  } catch {
    // storage full or unavailable - offline copies are best-effort
  }
}

export function getRecentById(id) {
  return getRecent().find((e) => String(e.id) === String(id)) ?? null
}
