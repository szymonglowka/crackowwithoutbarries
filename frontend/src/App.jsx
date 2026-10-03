import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet'
import L from 'leaflet'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'

// Bundlers break Leaflet's default icon URL detection, so set them explicitly
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
})

const KRAKOW_CENTER = [50.0647, 19.945]

function onEachPlace(feature, layer) {
  const { name, description } = feature.properties
  // Build DOM nodes rather than an HTML string so user content can't inject markup
  const content = document.createElement('div')
  const title = document.createElement('strong')
  title.textContent = name
  content.append(title)
  if (description) {
    const p = document.createElement('p')
    p.textContent = description
    content.append(p)
  }
  layer.bindPopup(content)
}

export default function App() {
  const [places, setPlaces] = useState(null)

  useEffect(() => {
    fetch('/api/places/')
      .then((res) => res.json())
      .then(setPlaces)
      .catch((err) => console.error('Failed to load places', err))
  }, [])

  return (
    <MapContainer center={KRAKOW_CENTER} zoom={13} style={{ height: '100%' }}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {places && <GeoJSON key={places.features.length} data={places} onEachFeature={onEachPlace} />}
    </MapContainer>
  )
}
