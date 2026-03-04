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
  pending:   { label:"စောင့်ဆိုင်းနေ", color:"bg-yellow-100 text-yellow-600" },
  accepted:  { label:"Rider လာနေသည်", color:"bg-blue-100 text-blue-600" },
  picked_up: { label:"သယ်ဆောင်နေ",   color:"bg-purple-100 text-purple-600" },
  delivered: { label:"ပို့ပြီး",        color:"bg-green-100 text-green-600" },
  cancelled: { label:"ပယ်ဖျက်",        color:"bg-red-100 text-red-500" },
}

export default function CustomerDashboard() {
  const { user }   = useAuth()
  const navigate   = useNavigate()
  const [orders, setOrders]         = useState([])
  const [onlineRiders, setOnlineRiders] = useState(0)
  const [loading, setLoading]       = useState(true)

  // Real orders from Firebase
  useEffect(() => {
    if (!user) return
    const q = query(collection(db, "orders"), where("customerId", "==", user.uid))
    const unsub = onSnapshot(q, snap => {
      const data = snap.docs
        .map(d => ({ id:d.id, ...d.data() }))
        .filter(o => !o.hiddenByCustomer)  // history ထဲမှ ဖျောက်ထားသောများ dashboard မှာလည်း မပြ
      data.sort((a,b) => (b.createdAt?.seconds||0) - (a.createdAt?.seconds||0))
      setOrders(data)
      setLoading(false)
    })
    return () => unsub()
  }, [user])

  // Online riders count
  useEffect(() => {
    const q = query(collection(db, "riders"), where("isOnline","==",true))
    const unsub = onSnapshot(q, snap => setOnlineRiders(snap.docs.length))
    return () => unsub()
  }, [])

  const activeOrders = orders.filter(o => ["pending","accepted","picked_up"].includes(o.status))
  const recentOrders = orders.filter(o => !o.hiddenByCustomer).slice(0, 5)

  const timeAgo = (ts) => {
    if (!ts) return ""
    const d = ts.toDate ? ts.toDate() : new Date(ts)
    const diff = Math.floor((Date.now()-d)/1000)
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
          <div className="h-48 rounded-3xl overflow-hidden shadow-card relative">
            <MapView height="100%" />
            <div className="absolute top-3 left-3 bg-white rounded-xl px-3 py-1.5 shadow-sm flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs font-semibold text-gray-700">{onlineRiders} Riders Online</span>
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
            <button onClick={() => navigate("/customer/track")}
              className="bg-white rounded-3xl p-4 text-left shadow-card active:scale-95 transition-all">
              <span className="text-3xl block mb-2">📍</span>
              <p className="text-dark font-display font-bold text-sm">Track Order</p>
              <p className="text-gray-400 text-xs">ခြေရာခံကြည့်</p>
            </button>
          </div>
        </div>

        {/* Active Orders */}
        {activeOrders.length > 0 && (
          <div className="px-4 mb-4">
            <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider">
              🔴 Active Orders ({activeOrders.length})
            </p>
            <div className="space-y-2">
              {activeOrders.map(order => (
                <div key={order.id}
                  className="bg-primary-500 rounded-3xl p-4 text-white shadow-primary cursor-pointer active:scale-[0.98] transition-all"
                  onClick={() => navigate("/customer/track")}>
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-bold bg-white/20 px-2 py-1 rounded-full">
                      #{order.id?.slice(-6).toUpperCase()}
                    </span>
                    <span className="text-xs bg-white/20 px-2 py-1 rounded-full">
                      {STATUS_LABEL[order.status]?.label}
                    </span>
                  </div>
                  <p className="text-xs text-primary-200 truncate mb-0.5">📦 {order.pickup?.address}</p>
                  <p className="text-xs text-primary-200 truncate mb-2">🎯 {order.dropoff?.address}</p>
                  <div className="flex justify-between items-center border-t border-white/20 pt-2">
                    <span className="text-sm font-display font-bold">
                      {(Number(order.itemValue||0)+Number(order.deliveryFee||0)).toLocaleString()} ကျပ်
                    </span>
                    <span className="text-xs bg-white text-primary-500 font-bold px-3 py-1 rounded-full">
                      Track →
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Orders */}
        <div className="px-4 mb-4">
          <div className="flex justify-between items-center mb-2">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Recent Orders</p>
            {orders.length > 5 && (
              <button onClick={() => navigate("/customer/history")}
                className="text-xs text-primary-500 font-semibold">အားလုံးကြည့် →</button>
            )}
          </div>

          {loading ? (
            <div className="text-center py-6">
              <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto" />
            </div>
          ) : recentOrders.length === 0 ? (
            <div className="card text-center py-8">
              <p className="text-3xl mb-2">📦</p>
              <p className="text-gray-400 text-sm">Order မရှိသေးပါ</p>
              <button onClick={() => navigate("/customer/order")}
                className="btn-primary mt-3 w-auto px-6 text-sm py-3">
                ပထမဆုံး Order တင်မည်
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {recentOrders.map(order => {
                const st = STATUS_LABEL[order.status] || STATUS_LABEL.pending
                const total = Number(order.itemValue||0)+Number(order.deliveryFee||0)
                return (
                  <div key={order.id}
                    className="card cursor-pointer active:scale-[0.98] transition-all"
                    onClick={() => navigate("/customer/history")}>
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-xs font-bold text-gray-400">#{order.id?.slice(-6).toUpperCase()}</span>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${st.color}`}>{st.label}</span>
                        <span className="text-xs text-gray-400">{timeAgo(order.createdAt)}</span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-600 truncate">📦 {order.pickup?.address}</p>
                    <p className="text-xs text-gray-600 truncate mb-1">🎯 {order.dropoff?.address}</p>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-xs text-gray-400">🏷️ {order.itemTypeLabel}</span>
                      <span className="font-display font-black text-primary-500 text-sm">{total.toLocaleString()} ကျပ်</span>
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
