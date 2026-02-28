// src/pages/admin/AdminDashboard.jsx
import { useNavigate } from "react-router-dom"
import Navbar from "../../components/common/Navbar"
import BottomNav from "../../components/common/BottomNav"
import { mockOrders } from "../../data/mockOrders"
import { mockRiders } from "../../data/mockRiders"
import { STATUS_LABEL, STATUS_COLOR } from "../../constants/orderStatus"

export default function AdminDashboard() {
  const navigate = useNavigate()
  const onlineRiders = mockRiders.filter(r => r.isOnline).length
  const totalRevenue = mockOrders.reduce((sum, o) => sum + o.price, 0)
  const pendingOrders = mockOrders.filter(o => o.status === "pending").length

  const stats = [
    { icon: "🏍️", value: onlineRiders, total: mockRiders.length, label: "Riders Online", color: "bg-green-50 text-green-600" },
    { icon: "📦", value: mockOrders.length, label: "Total Orders", color: "bg-blue-50 text-blue-600" },
    { icon: "⏳", value: pendingOrders, label: "Pending", color: "bg-yellow-50 text-yellow-600" },
    { icon: "💰", value: `${(totalRevenue/1000).toFixed(0)}K`, label: "Revenue (ကျပ်)", color: "bg-primary-50 text-primary-600" },
  ]

  return (
    <div className="flex flex-col h-screen bg-surface">
      <Navbar />

      <div className="flex-1 overflow-y-auto pb-24">

        {/* Header */}
        <div className="bg-dark px-4 pt-4 pb-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500 rounded-full opacity-10 blur-2xl -translate-y-1/2 translate-x-1/2" />
          <p className="text-gray-400 text-xs font-body">Admin Panel ⚙️</p>
          <h2 className="text-xl font-display font-black text-white">Overview Dashboard</h2>
        </div>

        {/* Stats Grid */}
        <div className="px-4 -mt-3 relative z-10 mb-4">
          <div className="grid grid-cols-2 gap-3 stagger">
            {stats.map(stat => (
              <div key={stat.label} className="card animate-slide-up">
                <div className={`w-10 h-10 rounded-2xl ${stat.color} flex items-center justify-center text-xl mb-2`}>
                  {stat.icon}
                </div>
                <p className="font-display font-black text-2xl text-dark">{stat.value}
                  {stat.total && <span className="text-gray-300 text-base font-normal">/{stat.total}</span>}
                </p>
                <p className="text-xs text-gray-400 font-body">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Nav */}
        <div className="px-4 mb-4 animate-slide-up" style={{ animationDelay: "0.1s" }}>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => navigate("/admin/map")}
              className="card flex items-center gap-3 active:scale-95 transition-all"
            >
              <div className="w-10 h-10 bg-primary-100 rounded-2xl flex items-center justify-center text-xl">🗺️</div>
              <div className="text-left">
                <p className="text-sm font-display font-bold text-dark">Live Map</p>
                <p className="text-xs text-gray-400">Riders ကြည့်</p>
              </div>
            </button>
            <button
              onClick={() => navigate("/admin/riders")}
              className="card flex items-center gap-3 active:scale-95 transition-all"
            >
              <div className="w-10 h-10 bg-blue-100 rounded-2xl flex items-center justify-center text-xl">🏍️</div>
              <div className="text-left">
                <p className="text-sm font-display font-bold text-dark">Riders</p>
                <p className="text-xs text-gray-400">စီမံမည်</p>
              </div>
            </button>
          </div>
        </div>

        {/* Recent Orders */}
        <div className="px-4 animate-slide-up" style={{ animationDelay: "0.15s" }}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Recent Orders</p>
            <button onClick={() => navigate("/admin/orders")} className="text-xs text-primary-500 font-semibold">
              All →
            </button>
          </div>
          <div className="space-y-2 stagger">
            {mockOrders.map(order => (
              <div key={order.id} className="card animate-slide-up">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-xs font-bold text-dark">#{order.id}</p>
                      <span className={`status-badge ${STATUS_COLOR[order.status]}`}>
                        {STATUS_LABEL[order.status]}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 truncate">{order.pickup.address} → {order.dropoff.address}</p>
                  </div>
                  <p className="text-sm font-display font-black text-primary-500 ml-2">{order.price.toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Riders Status */}
        <div className="px-4 mt-4 animate-slide-up" style={{ animationDelay: "0.2s" }}>
          <p className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wider">Riders Status</p>
          <div className="space-y-2 stagger">
            {mockRiders.map(rider => (
              <div key={rider.id} className="card animate-slide-up">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-10 h-10 bg-primary-100 rounded-2xl flex items-center justify-center text-lg">🏍️</div>
                    <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${rider.isOnline ? "bg-green-500" : "bg-gray-400"}`} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-dark">{rider.name}</p>
                    <p className="text-xs text-gray-400">⭐ {rider.rating} · {rider.totalDeliveries} trips</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-xs font-bold ${rider.isOnline ? "text-green-500" : "text-gray-400"}`}>
                      {rider.isOnline ? "● Online" : "○ Offline"}
                    </p>
                    <p className="text-xs text-gray-400">{rider.isAvailable ? "Available" : "Busy"}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  )
}
