// Shared Leaflet map. Import via `LazyMap` (index.js) so Leaflet is only downloaded
// when a map is actually shown (mobile-first: list before map).
//
// Props:
//   markers:  [{ id, lat, lon, label, match: 'match'|'barrier'|'unknown' }]
//   lines:    [{ id, coords: [[lat, lon], ...], color?, dashed? }]
//   center, zoom, highlightId, onMarkerClick(id), fitToContent
import { useEffect } from 'react'
import { MapContainer, Marker, Polyline, TileLayer, Tooltip, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import './MapView.css'

export const KRAKOW_CENTER = [50.0617, 19.9373]

// Pin shape depends on match status (circle / triangle / dashed circle), not only colour.
const PIN_SVG = {
  match: '<circle cx="14" cy="14" r="11" fill="#1d6b2f" stroke="#fff" stroke-width="3"/>',
  barrier: '<path d="M14 2L27 25H1z" fill="#a8200d" stroke="#fff" stroke-width="3" stroke-linejoin="round"/>',
  unknown: '<circle cx="14" cy="14" r="11" fill="#fff" stroke="#4a4a4a" stroke-width="3" stroke-dasharray="4 3"/>',
}

function pinIcon(match, highlighted) {
  const size = highlighted ? 40 : 28
  return L.divIcon({
    className: `map-pin${highlighted ? ' map-pin--active' : ''}`,
    html: `<svg width="${size}" height="${size}" viewBox="0 0 28 28" aria-hidden="true">${PIN_SVG[match] ?? PIN_SVG.unknown}</svg>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  })
}

function FitBounds({ markers, lines }) {
  const map = useMap()
  useEffect(() => {
    const pts = [...markers.map((m) => [m.lat, m.lon]), ...lines.flatMap((l) => l.coords)]
    if (pts.length > 1) map.fitBounds(pts, { padding: [32, 32] })
    else if (pts.length === 1) map.setView(pts[0], 17)
  }, [map, markers, lines])
  return null
}

export default function MapView({
  markers = [], lines = [], center = KRAKOW_CENTER, zoom = 15,
  highlightId, onMarkerClick, fitToContent = true, label = 'Mapa', className = '',
}) {
  return (
    <div className={`map-view ${className}`} role="region" aria-label={label}>
      <MapContainer center={center} zoom={zoom} className="map-view__map">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">współtwórcy OpenStreetMap</a>, ODbL'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {lines.map((l) => (
          <Polyline key={l.id} positions={l.coords}
            pathOptions={{ color: l.color ?? '#0b4f9c', weight: 6, dashArray: l.dashed ? '8 8' : undefined }} />
        ))}
        {markers.map((m) => (
          <Marker key={m.id} position={[m.lat, m.lon]} icon={pinIcon(m.match, m.id === highlightId)}
            title={m.label} alt={m.label} keyboard
            eventHandlers={onMarkerClick ? { click: () => onMarkerClick(m.id) } : undefined}>
            <Tooltip>{m.label}</Tooltip>
          </Marker>
        ))}
        {fitToContent && <FitBounds markers={markers} lines={lines} />}
      </MapContainer>
    </div>
  )
}
