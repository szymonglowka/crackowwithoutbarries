// The user's needs profile. Stored ONLY in localStorage - never sent anywhere except
// as query params for matching. We never ask about disability, only barriers.
//
// profile = { preset: 'wheelchair' | 'stroller' | 'custom', values: { max_steps, ... } }
// Use `profile.values` as the query params for /api/places/ and /api/route/.
import { useCallback, useSyncExternalStore } from 'react'

const KEY = 'bezprogu.profile'
const listeners = new Set()

// Fallback until the user picks something; mirrors catalog.PROFILE_PRESETS.wheelchair
export const DEFAULT_PROFILE = {
  preset: 'wheelchair',
  values: {
    max_steps: 0, max_threshold_cm: 2, min_door_width_cm: 80, max_incline_pct: 6,
    needs_elevator: true, needs_accessible_toilet: true, needs_changing_table: false,
    needs_seating: false, avoid_cobblestone: true,
  },
}

let snapshot = read()

function read() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) ?? DEFAULT_PROFILE
  } catch {
    return DEFAULT_PROFILE
  }
}

function subscribe(cb) {
  listeners.add(cb)
  return () => listeners.delete(cb)
}

export function useProfile() {
  const profile = useSyncExternalStore(subscribe, () => snapshot)
  const setProfile = useCallback((next) => {
    snapshot = typeof next === 'function' ? next(snapshot) : next
    localStorage.setItem(KEY, JSON.stringify(snapshot))
    listeners.forEach((l) => l())
  }, [])
  return [profile, setProfile]
}

/** Short text summary for the profile chip, e.g. "wózek · próg do 2 cm · drzwi min. 80 cm" */
export function describeProfile(profile) {
  const v = profile.values
  const parts = [
    { wheelchair: 'wózek', stroller: 'wózek dziecięcy', custom: 'własne ustawienia' }[profile.preset],
    v.max_threshold_cm != null && `próg do ${v.max_threshold_cm} cm`,
    v.min_door_width_cm != null && `drzwi min. ${v.min_door_width_cm} cm`,
  ]
  return parts.filter(Boolean).join(' · ')
}
