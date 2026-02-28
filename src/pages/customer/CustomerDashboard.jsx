// src/pages/customer/CustomerDashboard.jsx
import { useNavigate } from "react-router-dom"
import { useAuth } from "../../context/AuthContext"
import Navbar from "../../components/common/Navbar"
import BottomNav from "../../components/common/BottomNav"
import MapView from "../../components/map/MapView"
import OrderCard from "../../components/ui/OrderCard"
import { mockOrders } from "../../data/mockOrders"
import { mockRiders } from "../../data/mockRiders"

export default function CustomerDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const activeOrder = mockOrders.find(o => o.status === "accepted")
  const onlineRiders = mockRiders.filter(r => r.isOnline)

  return (
    <div className="flex flex-col h-screen bg-surface">
      <Navbar />

      <div className="flex-1 overflow-y-auto pb-24">

        {/* Greeting */}
        <div className="px-4 pt-4 pb-2 animate-slide-up">
          <p className="text-gray-400 text-xs font-body">မင်္ဂလာပါ 👋</p>
          <h2 className="text-xl font-display font-black text-dark">{user?.name}</h2>
        </div>

        {/* Map */}
        <div className="px-4 mb-4 animate-slide-up" style={{ animationDelay: "0.05s" }}>
          <div className="h-52 rounded-3xl overflow-hidden shadow-card relative">
            <MapView
              riders={onlineRiders}
              height="100%"
            />
            <div className="absolute top-3 left-3 bg-white rounded-xl px-3 py-1.5 shadow-sm flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs font-semibold text-gray-700">{onlineRiders.length} Riders Online</span>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="px-4 mb-4 animate-slide-up" style={{ animationDelay: "0.1s" }}>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => navigate("/customer/order")}
              className="bg-primary-500 rounded-3xl p-4 text-left shadow-primary active:scale-95 transition-all"
            >
              <span className="text-3xl block mb-2">📦</span>
              <p className="text-white font-display font-bold text-sm">Order ပို့မည်</p>
              <p className="text-primary-200 text-xs font-body">အမြန်ပို့ဆောင်</p>
            </button>
            <button
              onClick={() => navigate("/customer/track")}
              className="bg-white rounded-3xl p-4 text-left shadow-card active:scale-95 transition-all"
            >
              <span className="text-3xl block mb-2">📍</span>
              <p className="text-dark font-display font-bold text-sm">Track Order</p>
              <p className="text-gray-400 text-xs font-body">ခြေရာခံကြည့်</p>
            </button>
          </div>
        </div>

        {/* Active Order */}
        {activeOrder && (
          <div className="px-4 mb-4 animate-slide-up" style={{ animationDelay: "0.15s" }}>
            <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider">Active Order</p>
            <div className="bg-primary-500 rounded-3xl p-4 text-white shadow-primary">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold bg-white/20 px-2 py-1 rounded-full">#{activeOrder.id}</span>
                <span className="text-xs">🏍️ Rider လာနေသည်</span>
              </div>
              <p className="text-xs text-primary-200 mb-1">📦 {activeOrder.pickup.address}</p>
              <p className="text-xs text-primary-200">🎯 {activeOrder.dropoff.address}</p>
              <div className="mt-3 pt-3 border-t border-white/20 flex justify-between">
                <span className="text-sm font-display font-bold">{activeOrder.price.toLocaleString()} ကျပ်</span>
                <button
                  onClick={() => navigate("/customer/track")}
                  className="text-xs bg-white text-primary-500 font-bold px-3 py-1 rounded-full"
                >
                  Track →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Recent Orders */}
        <div className="px-4 animate-slide-up" style={{ animationDelay: "0.2s" }}>
          <p className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wider">Recent Orders</p>
          <div className="stagger">
            {mockOrders.slice(0, 3).map(order => (
              <OrderCard key={order.id} order={order} onClick={() => navigate("/customer/track")} />
            ))}
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  )
}
