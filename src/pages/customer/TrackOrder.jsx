// src/pages/customer/TrackOrder.jsx
import { useState, useEffect } from "react"
import Navbar from "../../components/common/Navbar"
import BottomNav from "../../components/common/BottomNav"
import MapView from "../../components/map/MapView"
import { mockOrders } from "../../data/mockOrders"
import { mockRiders } from "../../data/mockRiders"
import { STATUS_LABEL, STATUS_COLOR } from "../../constants/orderStatus"

const STEPS = ["pending", "accepted", "picked_up", "delivered"]

export default function TrackOrder() {
  const order = mockOrders[0]
  const rider = mockRiders[0]
  const [riderPos, setRiderPos] = useState(rider.currentLocation)

  // Simulate rider moving
  useEffect(() => {
    const interval = setInterval(() => {
      setRiderPos(prev => ({
        lat: prev.lat + (Math.random() - 0.5) * 0.001,
        lng: prev.lng + (Math.random() - 0.5) * 0.001,
      }))
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  const currentStep = STEPS.indexOf(order.status)

  return (
    <div className="flex flex-col h-screen bg-surface">
      <Navbar title="Track Order" />

      <div className="flex-1 overflow-y-auto pb-24">

        {/* Map */}
        <div className="h-64 relative">
          <MapView
            riders={[{ ...rider, currentLocation: riderPos }]}
            pickupPoint={order.pickup}
            dropoffPoint={order.dropoff}
            height="100%"
          />
          {/* Live badge */}
          <div className="absolute top-3 right-3 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            LIVE
          </div>
        </div>

        {/* Order Status */}
        <div className="px-4 -mt-4 relative z-10">
          <div className="card animate-slide-up">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs text-gray-400">Order #{order.id}</p>
                <p className="text-lg font-display font-black text-dark">{order.price.toLocaleString()} ကျပ်</p>
              </div>
              <span className={`status-badge ${STATUS_COLOR[order.status]}`}>
                {STATUS_LABEL[order.status]}
              </span>
            </div>

            {/* Progress Steps */}
            <div className="flex items-center justify-between mb-4">
              {STEPS.map((step, i) => (
                <div key={step} className="flex items-center flex-1">
                  <div className="flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm border-2 transition-all
                      ${i <= currentStep ? "bg-primary-500 border-primary-500 text-white" : "bg-white border-gray-200 text-gray-400"}`}>
                      {i <= currentStep ? "✓" : i + 1}
                    </div>
                    <p className="text-[9px] text-gray-400 mt-1 text-center w-14">{STATUS_LABEL[step]}</p>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-1 mb-4 transition-all ${i < currentStep ? "bg-primary-500" : "bg-gray-200"}`} />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Rider Info */}
        <div className="px-4 mt-3 animate-slide-up" style={{ animationDelay: "0.1s" }}>
          <div className="card">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-primary-100 rounded-2xl flex items-center justify-center text-2xl">
                🏍️
              </div>
              <div className="flex-1">
                <p className="font-display font-bold text-dark text-sm">{rider.name}</p>
                <p className="text-xs text-gray-400">⭐ {rider.rating} · {rider.totalDeliveries} deliveries</p>
              </div>
              <a href={`tel:${rider.phone}`} className="w-10 h-10 bg-primary-500 rounded-2xl flex items-center justify-center text-white shadow-primary">
                📞
              </a>
            </div>
          </div>
        </div>

        {/* Route Info */}
        <div className="px-4 mt-3 animate-slide-up" style={{ animationDelay: "0.15s" }}>
          <div className="card">
            <p className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wider">Route</p>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-sm">📦</div>
                <div>
                  <p className="text-xs text-gray-400">Pickup</p>
                  <p className="text-sm font-semibold text-gray-700">{order.pickup.address}</p>
                </div>
              </div>
              <div className="ml-4 flex items-center gap-2">
                <div className="w-px h-6 bg-gray-200" />
                <span className="text-xs text-gray-400">{order.distance} km</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center text-sm">🎯</div>
                <div>
                  <p className="text-xs text-gray-400">Dropoff</p>
                  <p className="text-sm font-semibold text-gray-700">{order.dropoff.address}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  )
}
