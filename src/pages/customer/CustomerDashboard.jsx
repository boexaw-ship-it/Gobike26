// src/pages/customer/CustomerDashboard.jsx
import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { collection, query, where, onSnapshot } from "firebase/firestore"
import { db } from "../../firebase/config"
import { useAuth } from "../../context/AuthContext"
import Navbar from "../../components/common/Navbar"
import BottomNav from "../../components/common/BottomNav"
import MapView from "../../components/map/MapView"

const STATUS_LABEL = {
  pending:   { label: "စောင့်ဆိုင်းနေ",  color: "bg-yellow-100 text-yellow-600" },
  accepted:  { label: "Rider လာနေသည်",  color: "bg-blue-100 text-blue-600" },
  picked_up: { label: "သယ်ဆောင်နေသည်", color: "bg-purple-100 text-purple-600" },
  delivered: { label: "ပို့ပြီး",          color: "bg-green-100 text-green-600" },
  cancelled: { label: "ပယ်ဖျက်ထား",      color: "bg-red-100 text-red-600" },
}

export default function CustomerDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [allOrders, setAllOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    // index မလိုဘဲ customerId တစ်ခုပဲ filter
    const q = query(
      collection(db, "orders"),
      where("customerId", "==", user.uid)
    )
    const unsub = onSnapshot(q, snap => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      data.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
      setAllOrders(data)
      setLoading(false)
    })
    return () => unsub()
  }, [user])

  const activeOrders = allOrders.filter(o => ["pending","accepted","picked_up"].includes(o.status))
  const recentOrders = allOrders.slice(0, 3)

  const timeAgo = (ts) => {
    if (!ts) return ""
    const d = ts.toDate ? ts.toDate() : new Date(ts)
    const diff = Math.floor((Date.now() - d) / 1000)
    if (diff < 60) return "ခုနက"
    if (diff < 3600) return `${Math.floor(diff/60)} မိနစ်က`
    if (diff < 86400) return `${Math.floor(diff/3600)} နာရီက`
    return `${Math.floor(diff/86400)} ရက်က`
  }

  return (
    <div className="flex flex-col h-screen bg-surface">
      <Navbar />
      <div className="flex-1 overflow-y-auto pb-24">

        {/* Greeting */}
        <div className="px-4 pt-4 pb-2">
          <p className="text-gray-400 text-xs">မင်္ဂလာပါ 👋</p>
          <h2 className="text-xl font-display font-black text-dark">{user?.name}</h2>
        </div>

        {/* Map */}
        <div className="px-4 mb-4">
          <div className="h-52 rounded-3xl overflow-hidden shadow-card relative">
            <MapView height="100%" />
            <div className="absolute top-3 left-3 bg-white rounded-xl px-3 py-1.5 shadow-sm flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs font-semibold text-gray-700">Gobike Delivery</span>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="px-4 mb-4">
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => navigate("/customer/order")}
              className="bg-primary-500 rounded-3xl p-4 text-left shadow-primary active:scale-95 transition-all">
              <span className="text-3xl block mb-2">📦</span>
              <p className="text-white font-display font-bold text-sm">Order ပို့မည်</p>
              <p className="text-primary-200 text-xs">အမြန်ပို့ဆောင်</p>
            </button>
            <button onClick={() => navigate("/customer/history")}
              className="bg-white rounded-3xl p-4 text-left shadow-card active:scale-95 transition-all">
              <span className="text-3xl block mb-2">📋</span>
              <p className="text-dark font-display font-bold text-sm">Order မှတ်တမ်း</p>
              <p className="text-gray-400 text-xs">History ကြည့်</p>
            </button>
          </div>
        </div>

        {/* Active Orders */}
        {activeOrders.length > 0 && (
          <div className="px-4 mb-4">
            <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider">
              Active Orders ({activeOrders.length})
            </p>
            <div className="space-y-3">
              {activeOrders.map(order => {
                const status = STATUS_LABEL[order.status] || STATUS_LABEL.pending
                return (
                  <div key={order.id} className="bg-primary-500 rounded-3xl p-4 text-white shadow-primary">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-semibold bg-white/20 px-2 py-1 rounded-full">
                        #{order.id?.slice(-6).toUpperCase()}
                      </span>
                      <span className="text-xs bg-white/20 px-2 py-1 rounded-full font-semibold">
                        {status.label}
                      </span>
                    </div>
                    <p className="text-xs text-primary-200 mb-1">📦 {order.pickup?.address}</p>
                    <p className="text-xs text-primary-200 mb-3">🎯 {order.dropoff?.address}</p>
                    <div className="pt-3 border-t border-white/20 flex justify-between items-center">
                      <span className="text-sm font-display font-bold">
                        {order.deliveryFee?.toLocaleString()} ကျပ်
                      </span>
                      <span className="text-xs text-primary-200">{timeAgo(order.createdAt)}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Recent Orders */}
        <div className="px-4">
          <div className="flex justify-between items-center mb-2">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Recent Orders</p>
            <button onClick={() => navigate("/customer/history")} className="text-xs text-primary-500 font-semibold">
              အားလုံး →
            </button>
          </div>
          {loading ? (
            <div className="text-center py-8">
              <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-xs text-gray-400">Loading...</p>
            </div>
          ) : recentOrders.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-3xl mb-2">📦</p>
              <p className="text-gray-400 text-sm">Order မရှိသေးပါ</p>
              <button onClick={() => navigate("/customer/order")} className="btn-primary mt-3 w-auto px-6">
                ပထမဆုံး Order တင်မည်
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {recentOrders.map(order => {
                const status = STATUS_LABEL[order.status] || STATUS_LABEL.pending
                return (
                  <div key={order.id} className="card active:scale-[0.98] transition-all cursor-pointer"
                    onClick={() => navigate("/customer/history")}>
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-xs font-bold text-gray-400">#{order.id?.slice(-6).toUpperCase()}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${status.color}`}>
                        {status.label}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mb-1">
                      📦 {order.pickup?.address} → 🎯 {order.dropoff?.address}
                    </p>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-display font-black text-primary-500">
                        {order.deliveryFee?.toLocaleString()} ကျပ်
                      </span>
                      <span className="text-xs text-gray-400">{timeAgo(order.createdAt)}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
      <BottomNav />
    </div>
  )
}
