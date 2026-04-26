"use client"
/**
 * VetMap — Leaflet map showing user location + nearby vet markers.
 * Dynamically imported (no SSR) to avoid Leaflet window errors.
 */
import { useEffect } from "react"
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from "react-leaflet"
import L from "leaflet"
import "leaflet/dist/leaflet.css"

// Fix default icon paths broken by webpack
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl:       "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl:     "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
})

// Orange marker for FurryFile vets
const ffIcon = new L.Icon({
  iconUrl:       "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png",
  shadowUrl:     "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize:      [25, 41],
  iconAnchor:    [12, 41],
  popupAnchor:   [1, -34],
  shadowSize:    [41, 41],
})

// Blue marker for OSM clinics
const osmIcon = new L.Icon({
  iconUrl:       "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png",
  shadowUrl:     "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize:      [25, 41],
  iconAnchor:    [12, 41],
  popupAnchor:   [1, -34],
  shadowSize:    [41, 41],
})

// Red marker for user location
const userIcon = new L.Icon({
  iconUrl:       "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
  shadowUrl:     "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize:      [25, 41],
  iconAnchor:    [12, 41],
  popupAnchor:   [1, -34],
  shadowSize:    [41, 41],
})

interface Vet {
  id: string
  name: string
  lat: number
  lon: number
  address?: string
  phone?: string
  source: "furryfile" | "osm"
  bio?: string
}

interface Props {
  center: [number, number]
  vets: Vet[]
  onVetClick: (vet: Vet) => void
}

/** Keeps map centred when center prop changes */
function Recenter({ center }: { center: [number, number] }) {
  const map = useMap()
  useEffect(() => { map.setView(center, map.getZoom()) }, [center, map])
  return null
}

export default function VetMap({ center, vets, onVetClick }: Props) {
  return (
    <MapContainer
      center={center}
      zoom={13}
      style={{ height: "320px", width: "100%", borderRadius: "8px" }}
      scrollWheelZoom={false}
    >
      <Recenter center={center} />
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* 10 km radius circle */}
      <Circle
        center={center}
        radius={10000}
        pathOptions={{ color: "#f97316", fillColor: "#fed7aa", fillOpacity: 0.08, weight: 1.5 }}
      />

      {/* User position */}
      <Marker position={center} icon={userIcon}>
        <Popup><strong>📍 Your location</strong></Popup>
      </Marker>

      {/* Vet markers */}
      {vets.map(vet => (
        <Marker
          key={vet.id}
          position={[vet.lat, vet.lon]}
          icon={vet.source === "furryfile" ? ffIcon : osmIcon}
          eventHandlers={{ click: () => onVetClick(vet) }}
        >
          <Popup>
            <div className="min-w-[160px]">
              <p className="font-semibold text-sm">{vet.name}</p>
              {vet.source === "furryfile" && (
                <span className="inline-block text-[10px] bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded mb-1">FurryFile Vet</span>
              )}
              {vet.address && <p className="text-xs text-gray-500 mt-0.5">{vet.address}</p>}
              {vet.phone   && <p className="text-xs text-gray-500">{vet.phone}</p>}
              {vet.bio     && <p className="text-xs text-gray-400 italic mt-1">{vet.bio}</p>}
              <button
                className="mt-2 w-full text-xs bg-orange-500 text-white rounded px-2 py-1 hover:bg-orange-600"
                onClick={() => onVetClick(vet)}
              >
                Book Appointment
              </button>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}
