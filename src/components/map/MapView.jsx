// src/components/map/MapView.jsx
import { useEffect, useRef } from "react"
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from "react-leaflet"
import { MAP_CENTER, MAP_ZOOM, TILE_URL, TILE_ATTRIBUTION } from "../../constants/mapConfig"
import L from "leaflet"
import "leaflet/dist/leaflet.css"

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl:       "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl:     "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
})

const riderIcon = L.divIcon({
  className: "",
  html: `<div style="
    width:40px;height:40px;
    background:#FF5A1F;
    border-radius:50% 50% 50% 0;
    transform:rotate(-45deg);
    border:3px solid white;
    box-shadow:0 2px 10px rgba(0,0,0,0.35);
    display:flex;align-items:center;justify-content:center;">
    <span style="transform:rotate(45deg);font-size:18px;">🏍️</span>
  </div>`,
  iconSize: [40, 40], iconAnchor: [20, 40],
})

const pickupIcon = L.divIcon({
  className: "",
  html: `<div style="
    width:34px;height:34px;background:#22c55e;
    border-radius:50%;border:3px solid white;
    box-shadow:0 2px 8px rgba(0,0,0,0.2);
    display:flex;align-items:center;justify-content:center;font-size:16px;">📦</div>`,
  iconSize: [34, 34], iconAnchor: [17, 17],
})

const dropoffIcon = L.divIcon({
  className: "",
  html: `<div style="
    width:34px;height:34px;background:#ef4444;
    border-radius:50%;border:3px solid white;
    box-shadow:0 2px 8px rgba(0,0,0,0.2);
    display:flex;align-items:center;justify-content:center;font-size:16px;">🎯</div>`,
  iconSize: [34, 34], iconAnchor: [17, 17],
})

// Auto-fit map to show all markers
function FitBounds({ pickup, dropoff, riderLocation }) {
  const map = useMap()
  useEffect(() => {
    const points = []
    if (pickup)        points.push([pickup.lat, pickup.lng])
    if (dropoff)       points.push([dropoff.lat, dropoff.lng])
    if (riderLocation) points.push([riderLocation.lat, riderLocation.lng])
    if (points.length >= 2) {
      map.fitBounds(points, { padding: [50, 50] })
    } else if (points.length === 1) {
      map.setView(points[0], 14)
    }
  }, [pickup, dropoff, riderLocation])
  return null
}

// Move rider marker smoothly
function AnimatedRiderMarker({ position, name }) {
  const markerRef = useRef(null)
  useEffect(() => {
    if (markerRef.current && position) {
      markerRef.current.setLatLng([position.lat, position.lng])
    }
  }, [position])
  if (!position) return null
  return (
    <Marker
      ref={markerRef}
      position={[position.lat, position.lng]}
      icon={riderIcon}
    >
      <Popup>
        <div className="text-xs">
          <p className="font-bold">🏍️ {name || "Rider"}</p>
          <p className="text-green-600 font-semibold">သယ်ဆောင်နေသည်</p>
        </div>
      </Popup>
    </Marker>
  )
}

export default function MapView({
  riders        = [],
  pickupPoint   = null,
  dropoffPoint  = null,
  riderLocation = null,  // { lat, lng } — live rider position
  riderName     = "",
  height        = "100%",
  zoom          = MAP_ZOOM,
  center        = MAP_CENTER,
}) {
  return (
    <MapContainer
      center={center}
      zoom={zoom}
      style={{ height, width: "100%", borderRadius: "1rem" }}
      zoomControl={false}
    >
      <TileLayer url={TILE_URL} attribution={TILE_ATTRIBUTION} />

      {/* Auto-fit to markers */}
      <FitBounds
        pickup={pickupPoint}
        dropoff={dropoffPoint}
        riderLocation={riderLocation}
      />

      {/* Live Rider (single, from active delivery) */}
      <AnimatedRiderMarker position={riderLocation} name={riderName} />

      {/* Multiple Riders (dashboard use) */}
      {riders.map(rider => rider.currentLocation && (
        <Marker
          key={rider.id}
          position={[rider.currentLocation.lat, rider.currentLocation.lng]}
          icon={riderIcon}
        >
          <Popup>
            <div className="text-xs">
              <p className="font-bold">{rider.name}</p>
              <p className="text-gray-500">{rider.isOnline ? "🟢 Online" : "🔴 Offline"}</p>
            </div>
          </Popup>
        </Marker>
      ))}

      {/* Pickup */}
      {pickupPoint && (
        <>
          <Marker position={[pickupPoint.lat, pickupPoint.lng]} icon={pickupIcon}>
            <Popup><span className="text-xs font-bold">📦 {pickupPoint.address}</span></Popup>
          </Marker>
          <Circle
            center={[pickupPoint.lat, pickupPoint.lng]}
            radius={200}
            pathOptions={{ color:"#22c55e", fillColor:"#22c55e", fillOpacity:0.1 }}
          />
        </>
      )}

      {/* Dropoff */}
      {dropoffPoint && (
        <Marker position={[dropoffPoint.lat, dropoffPoint.lng]} icon={dropoffIcon}>
          <Popup><span className="text-xs font-bold">🎯 {dropoffPoint.address}</span></Popup>
        </Marker>
      )}
    </MapContainer>
  )
}
