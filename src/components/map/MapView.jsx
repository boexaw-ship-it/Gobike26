// src/components/map/MapView.jsx
import { MapContainer, TileLayer, Marker, Popup, Circle } from "react-leaflet"
import { MAP_CENTER, MAP_ZOOM, TILE_URL, TILE_ATTRIBUTION } from "../../constants/mapConfig"
import L from "leaflet"
import "leaflet/dist/leaflet.css"

// Fix default marker icon
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
})

const riderIcon = L.divIcon({
  className: "",
  html: `<div style="
    width:36px; height:36px;
    background:#FF5A1F;
    border-radius:50% 50% 50% 0;
    transform:rotate(-45deg);
    border:3px solid white;
    box-shadow:0 2px 8px rgba(0,0,0,0.3);
    display:flex; align-items:center; justify-content:center;
  ">
    <span style="transform:rotate(45deg); font-size:16px;">🏍️</span>
  </div>`,
  iconSize: [36, 36],
  iconAnchor: [18, 36],
})

const pickupIcon = L.divIcon({
  className: "",
  html: `<div style="
    width:32px; height:32px;
    background:#22c55e;
    border-radius:50%;
    border:3px solid white;
    box-shadow:0 2px 8px rgba(0,0,0,0.2);
    display:flex; align-items:center; justify-content:center;
    font-size:14px;
  ">📦</div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
})

const dropoffIcon = L.divIcon({
  className: "",
  html: `<div style="
    width:32px; height:32px;
    background:#ef4444;
    border-radius:50%;
    border:3px solid white;
    box-shadow:0 2px 8px rgba(0,0,0,0.2);
    display:flex; align-items:center; justify-content:center;
    font-size:14px;
  ">🎯</div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
})

export default function MapView({
  riders = [],
  pickupPoint = null,
  dropoffPoint = null,
  height = "100%",
  zoom = MAP_ZOOM,
  center = MAP_CENTER,
}) {
  return (
    <MapContainer
      center={center}
      zoom={zoom}
      style={{ height, width: "100%", borderRadius: "1rem" }}
      zoomControl={false}
    >
      <TileLayer url={TILE_URL} attribution={TILE_ATTRIBUTION} />

      {/* Riders */}
      {riders.map(rider => rider.currentLocation && (
        <Marker
          key={rider.id}
          position={[rider.currentLocation.lat, rider.currentLocation.lng]}
          icon={riderIcon}
        >
          <Popup>
            <div className="text-xs">
              <p className="font-bold">{rider.name}</p>
              <p className="text-gray-500">{rider.isAvailable ? "✅ Available" : "🔴 Busy"}</p>
              <p>⭐ {rider.rating}</p>
            </div>
          </Popup>
        </Marker>
      ))}

      {/* Pickup */}
      {pickupPoint && (
        <>
          <Marker
            position={[pickupPoint.lat, pickupPoint.lng]}
            icon={pickupIcon}
          >
            <Popup><span className="text-xs font-bold">📦 {pickupPoint.address}</span></Popup>
          </Marker>
          <Circle
            center={[pickupPoint.lat, pickupPoint.lng]}
            radius={200}
            pathOptions={{ color: "#22c55e", fillColor: "#22c55e", fillOpacity: 0.1 }}
          />
        </>
      )}

      {/* Dropoff */}
      {dropoffPoint && (
        <Marker
          position={[dropoffPoint.lat, dropoffPoint.lng]}
          icon={dropoffIcon}
        >
          <Popup><span className="text-xs font-bold">🎯 {dropoffPoint.address}</span></Popup>
        </Marker>
      )}
    </MapContainer>
  )
}
