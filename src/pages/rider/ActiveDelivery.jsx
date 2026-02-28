// src/pages/rider/ActiveDelivery.jsx
import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import Navbar from "../../components/common/Navbar"
import BottomNav from "../../components/common/BottomNav"
import MapView from "../../components/map/MapView"
import { mockOrders } from "../../data/mockOrders"
import { mockRiders } from "../../data/mockRiders"

const STATUS_FLOW = [
  { key: "accepted",  icon: "✅", label: "Order လက်ခံပြီ",  action: "ပစ္စည်းယူပြီ" },
  { key: "picked_up", icon: "📦", label: "ပစ္စည်းယူပြီ",     action: "ပို့ဆောင်ပြီ" },
  { key: "delivered", icon: "🎉", label: "ပို့ဆောင်ပြီးပြီ",  action: null },
]

export default function ActiveDelivery() {
  const navigate = useNavigate()
  const order = mockOrders[0]
  const rider = mockRiders[0]
  const [statusIdx, setStatusIdx] = useState(0)
  const [riderPos, setRiderPos] = useState(rider.currentLocation)

  useEffect(() => {
    const interval = setInterval(() => {
      setRiderPos(prev => ({
        lat: prev.lat + (Math.random() - 0.5) * 0.001,
        lng: prev.lng + (Math.random() - 0.5) * 0.001,
      }))
    }, 2000)
    return () => clearInterval(interval)
  }, [])

  const currentStatus = STATUS_FLOW[statusIdx]
  const isDelivered = statusIdx === STATUS_FLOW.length - 1

  const handleNext = () => {
    if (statusIdx < STATUS_FLOW.length - 1) {
      setStatusIdx(statusIdx + 1)
    }
  }

  return (
    <div className="flex flex-col h-screen bg-surface">
      <Navbar title="Active Delivery" />

      <div className="flex-1 overflow-y-auto pb-28">

        {/* Map */}
        <div className="h-56 relative">
          <MapView
            riders={[{ ...rider, currentLocation: riderPos }]}
            pickupPoint={order.pickup}
            dropoffPoint={order.dropoff}
            height="100%"
          />
          <div className="absolute top-3 left-3 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            GPS Active
          </div>
        </div>

        {/* Status Card */}
        <div className="px-4 -mt-4 relative z-10">
          <div className={`card animate-slide-up ${isDelivered ? "border-2 border-green-400" : ""}`}>
            <div className="text-center py-2">
              <span className="text-4xl">{currentStatus.icon}</span>
              <p className="font-display font-black text-dark text-lg mt-2">{currentStatus.label}</p>
            </div>

            {/* Progress */}
            <div className="flex items-center justify-center gap-2 my-4">
              {STATUS_FLOW.map((s, i) => (
                <div key={s.key} className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all
                    ${i <= statusIdx ? "bg-primary-500 border-primary-500 text-white" : "bg-white border-gray-200 text-gray-400"}`}>
                    {i < statusIdx ? "✓" : i + 1}
                  </div>
                  {i < STATUS_FLOW.length - 1 && (
                    <div className={`w-8 h-0.5 transition-all ${i < statusIdx ? "bg-primary-500" : "bg-gray-200"}`} />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Order Info */}
        <div className="px-4 mt-3 animate-slide-up" style={{ animationDelay: "0.05s" }}>
          <div className="card">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-gray-400">#{order.id}</p>
              <p className="font-display font-black text-primary-500">{order.price.toLocaleString()} ကျပ်</p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-sm">📦</div>
                <div>
                  <p className="text-xs text-gray-400">Pickup</p>
                  <p className="text-xs font-semibold text-gray-700">{order.pickup.address}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center text-sm">🎯</div>
                <div>
                  <p className="text-xs text-gray-400">Dropoff</p>
                  <p className="text-xs font-semibold text-gray-700">{order.dropoff.address}</p>
                </div>
              </div>
            </div>
            {order.note && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                <p className="text-xs text-gray-400">မှတ်ချက်</p>
                <p className="text-xs text-gray-600">{order.note}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Action */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 py-4 pb-8">
        {!isDelivered ? (
          <button onClick={handleNext} className="btn-primary">
            {currentStatus.action} →
          </button>
        ) : (
          <button
            onClick={() => navigate("/rider")}
            className="w-full bg-green-500 text-white font-display font-bold py-4 rounded-2xl shadow-lg active:scale-95 transition-all"
          >
            🎉 Delivery ပြီးပြီ! Dashboard သို့ပြန်မည်
          </button>
        )}
      </div>
    </div>
  )
}
