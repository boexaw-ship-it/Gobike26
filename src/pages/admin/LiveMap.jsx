// src/pages/admin/LiveMap.jsx
import Navbar from "../../components/common/Navbar"
import BottomNav from "../../components/common/BottomNav"
import MapView from "../../components/map/MapView"
import { mockRiders } from "../../data/mockRiders"
import { mockOrders } from "../../data/mockOrders"

export default function LiveMap() {
  const onlineRiders = mockRiders.filter(r => r.isOnline)

  return (
    <div className="flex flex-col h-screen bg-surface">
      <Navbar title="Live Map" />

      <div className="flex-1 flex flex-col pb-16">

        {/* Stats bar */}
        <div className="flex items-center gap-4 px-4 py-3 bg-white border-b border-gray-100">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs font-semibold text-gray-700">{onlineRiders.length} Online Riders</span>
          </div>
          <div className="w-px h-4 bg-gray-200" />
          <span className="text-xs text-gray-500">📦 {mockOrders.filter(o => o.status === "accepted").length} Active Orders</span>
        </div>

        {/* Full Map */}
        <div className="flex-1 px-3 py-3">
          <MapView
            riders={onlineRiders}
            pickupPoint={mockOrders[0].pickup}
            dropoffPoint={mockOrders[0].dropoff}
            height="100%"
            zoom={12}
          />
        </div>

        {/* Legend */}
        <div className="px-4 py-2 flex items-center gap-4 bg-white border-t border-gray-100">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-primary-500" />
            <span className="text-[10px] text-gray-500">Rider</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span className="text-[10px] text-gray-500">Pickup</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <span className="text-[10px] text-gray-500">Dropoff</span>
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  )
}
