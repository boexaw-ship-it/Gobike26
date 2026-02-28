// src/pages/rider/RiderDashboard.jsx
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../../context/AuthContext"
import Navbar from "../../components/common/Navbar"
import BottomNav from "../../components/common/BottomNav"
import MapView from "../../components/map/MapView"
import { mockOrders } from "../../data/mockOrders"
import { mockRiders } from "../../data/mockRiders"

export default function RiderDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [isOnline, setIsOnline] = useState(true)
  const pendingOrders = mockOrders.filter(o => o.status === "pending")
  const rider = mockRiders[0]

  return (
    <div className="flex flex-col h-screen bg-surface">
      <Navbar />

      <div className="flex-1 overflow-y-auto pb-24">

        {/* Status Header */}
        <div className={`px-4 py-4 ${isOnline ? "bg-dark" : "bg-gray-700"} transition-colors`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-xs font-body">မင်္ဂလာပါ 🏍️</p>
              <h2 className="text-lg font-display font-black text-white">{user?.name}</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-yellow-400 text-xs">⭐ {rider.rating}</span>
                <span className="text-gray-500 text-xs">·</span>
                <span className="text-gray-400 text-xs">{rider.totalDeliveries} deliveries</span>
              </div>
            </div>

            {/* Online Toggle */}
            <div className="flex flex-col items-center gap-1">
              <button
                onClick={() => setIsOnline(!isOnline)}
                className={`relative w-14 h-8 rounded-full transition-colors ${isOnline ? "bg-green-500" : "bg-gray-500"}`}
              >
                <div className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow transition-transform ${isOnline ? "translate-x-7" : "translate-x-1"}`} />
              </button>
              <span className={`text-[10px] font-bold ${isOnline ? "text-green-400" : "text-gray-400"}`}>
                {isOnline ? "ONLINE" : "OFFLINE"}
              </span>
            </div>
          </div>
        </div>

        {/* Map */}
        <div className="px-4 mt-4 mb-4 animate-slide-up">
          <div className="h-44 rounded-3xl overflow-hidden shadow-card">
            <MapView
              riders={isOnline ? [rider] : []}
              height="100%"
            />
          </div>
        </div>

        {/* Today Stats */}
        <div className="px-4 mb-4 animate-slide-up" style={{ animationDelay: "0.05s" }}>
          <div className="grid grid-cols-3 gap-2">
            {[
              { icon: "📦", value: "5", label: "ယနေ့ Orders" },
              { icon: "💰", value: "22,500", label: "ကျပ် (ယနေ့)" },
              { icon: "⭐", value: "4.8", label: "Rating" },
            ].map(stat => (
              <div key={stat.label} className="card text-center">
                <p className="text-xl mb-1">{stat.icon}</p>
                <p className="font-display font-black text-dark text-base">{stat.value}</p>
                <p className="text-[10px] text-gray-400 font-body">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Available Orders */}
        {isOnline && (
          <div className="px-4 animate-slide-up" style={{ animationDelay: "0.1s" }}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Available Orders</p>
              <span className="bg-primary-100 text-primary-600 text-xs font-bold px-2 py-0.5 rounded-full">
                {pendingOrders.length} new
              </span>
            </div>

            {pendingOrders.length === 0 ? (
              <div className="card text-center py-8">
                <p className="text-3xl mb-2">📭</p>
                <p className="text-gray-400 text-sm font-body">Order မရှိသေးပါ</p>
              </div>
            ) : (
              <div className="space-y-3 stagger">
                {pendingOrders.map(order => (
                  <div key={order.id} className="card animate-slide-up">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="text-xs text-gray-400">#{order.id}</p>
                        <p className="font-display font-black text-dark">{order.price.toLocaleString()} ကျပ်</p>
                      </div>
                      <span className="text-xs text-gray-400">{order.distance} km</span>
                    </div>

                    <div className="space-y-1.5 mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500" />
                        <p className="text-xs text-gray-600 truncate">{order.pickup.address}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-red-500" />
                        <p className="text-xs text-gray-600 truncate">{order.dropoff.address}</p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button className="flex-1 py-2.5 rounded-xl bg-gray-100 text-gray-600 text-xs font-bold">
                        ❌ Reject
                      </button>
                      <button
                        onClick={() => navigate("/rider/delivery")}
                        className="flex-1 py-2.5 rounded-xl bg-primary-500 text-white text-xs font-bold shadow-primary"
                      >
                        ✅ Accept
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {!isOnline && (
          <div className="px-4 py-8 text-center animate-fade-in">
            <p className="text-5xl mb-3">😴</p>
            <p className="text-gray-400 font-body text-sm">Offline mode - Orders မမြင်ရပါ</p>
            <button
              onClick={() => setIsOnline(true)}
              className="mt-4 btn-primary w-auto px-8 inline-block"
            >
              Online ဖွင့်မည်
            </button>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  )
}
