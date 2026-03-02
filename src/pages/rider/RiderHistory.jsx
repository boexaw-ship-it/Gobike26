// src/pages/rider/RiderHistory.jsx
import { useState, useEffect } from "react"
import { collection, query, where, onSnapshot } from "firebase/firestore"
import { db } from "../../firebase/config"
import { useAuth } from "../../context/AuthContext"
import Navbar from "../../components/common/Navbar"
import BottomNav from "../../components/common/BottomNav"

function OrderDetailModal({ order, onClose }) {
  const total = (order.itemValue || 0) + (order.deliveryFee || 0)
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
      <div className="bg-white w-full rounded-t-3xl px-6 py-6 max-h-[85vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-display font-black text-dark">
            Order #{order.id?.slice(-6).toUpperCase()}
          </h3>
          <button onClick={onClose} className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">✕</button>
        </div>

        {/* Route */}
        <div className="card mb-3 space-y-3">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Route</p>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">📦</div>
            <div>
              <p className="text-xs text-gray-400">ယူခဲ့သောနေရာ</p>
              <p className="text-sm font-semibold">{order.pickup?.address}</p>
            </div>
          </div>
          <div className="w-px h-3 bg-gray-200 ml-4" />
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">🎯</div>
            <div>
              <p className="text-xs text-gray-400">ပို့ခဲ့သောနေရာ</p>
              <p className="text-sm font-semibold">{order.dropoff?.address}</p>
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="card mb-3 space-y-2">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">ပစ္စည်းအချက်အလက်</p>
          <div className="flex justify-between text-xs">
            <span className="text-gray-400">ပစ္စည်းအမျိုး</span>
            <span className="font-semibold">{order.itemTypeLabel || order.itemType}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-gray-400">ပစ္စည်းတန်ဖိုး</span>
            <span className="font-semibold">{Number(order.itemValue||0).toLocaleString()} ကျပ်</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-gray-400">Customer</span>
            <span className="font-semibold">{order.customerName}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-gray-400">ဖုန်းနံပါတ်</span>
            <a href={`tel:${order.customerPhone}`} className="font-semibold text-primary-500">{order.customerPhone}</a>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-gray-400">ငွေပေးချေမှု</span>
            <span className="font-semibold">{order.paymentType === "cod" ? "💵 COD" : "✅ Cash"}</span>
          </div>
          {order.note && (
            <div className="flex justify-between text-xs">
              <span className="text-gray-400">မှတ်ချက်</span>
              <span className="font-semibold text-right max-w-[60%]">{order.note}</span>
            </div>
          )}
          {order.rating && (
            <div className="flex justify-between text-xs">
              <span className="text-gray-400">Rating</span>
              <span>{"⭐".repeat(order.rating)}</span>
            </div>
          )}
        </div>

        {/* Fee Breakdown */}
        <div className="bg-gray-50 rounded-2xl p-4 space-y-2 mb-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">ငွေစာရင်း</p>
          <div className="flex justify-between text-xs">
            <span className="text-gray-500">💎 ပစ္စည်းတန်ဖိုး</span>
            <span className="font-semibold">{Number(order.itemValue||0).toLocaleString()} ကျပ်</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-gray-500">🚚 Delivery Fee</span>
            <span className="font-semibold">{Number(order.deliveryFee||0).toLocaleString()} ကျပ်</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-gray-500">📊 Commission (10%)</span>
            <span className="text-red-500 font-semibold">- {Number(order.commission||0).toLocaleString()} ကျပ်</span>
          </div>
          <div className="border-t border-gray-200 pt-2 flex justify-between items-center">
            <span className="text-sm font-bold text-gray-700">🏍️ Rider ရရှိသည်</span>
            <span className="text-xl font-display font-black text-green-600">{Number(order.riderNet||0).toLocaleString()} ကျပ်</span>
          </div>
        </div>
        <button onClick={onClose} className="btn-primary">ပိတ်မည်</button>
      </div>
    </div>
  )
}

export default function RiderHistory() {
  const { user } = useAuth()
  const [orders, setOrders]       = useState([])
  const [loading, setLoading]     = useState(true)
  const [selected, setSelected]   = useState(null)
  const [filter, setFilter]       = useState("all")

  useEffect(() => {
    if (!user) return
    const q = query(
      collection(db, "orders"),
      where("riderId", "==", user.uid)
    )
    const unsub = onSnapshot(q, snap => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      data.sort((a, b) => (b.createdAt?.seconds||0) - (a.createdAt?.seconds||0))
      setOrders(data)
      setLoading(false)
    })
    return () => unsub()
  }, [user])

  const filtered = filter === "all" ? orders :
    filter === "delivered" ? orders.filter(o => o.status === "delivered") :
    orders.filter(o => o.status === "cancelled")

  const totalEarned = orders.filter(o => o.status === "delivered")
    .reduce((s, o) => s + (o.riderNet || 0), 0)

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
      <Navbar title="Delivery မှတ်တမ်း" />
      <div className="flex-1 overflow-y-auto pb-24">

        {/* Summary */}
        <div className="px-4 pt-4 mb-3">
          <div className="grid grid-cols-2 gap-2">
            <div className="card text-center">
              <p className="text-xl mb-1">📦</p>
              <p className="font-display font-black text-dark">{orders.filter(o=>o.status==="delivered").length}</p>
              <p className="text-[10px] text-gray-400">Deliveries</p>
            </div>
            <div className="card text-center">
              <p className="text-xl mb-1">💰</p>
              <p className="font-display font-black text-green-600 text-sm">{totalEarned.toLocaleString()}</p>
              <p className="text-[10px] text-gray-400">ကျပ် (စုစုပေါင်း)</p>
            </div>
          </div>
        </div>

        {/* Filter */}
        <div className="px-4 mb-3 flex gap-2">
          {[["all","အားလုံး"],["delivered","ပို့ပြီး"],["cancelled","ပယ်ဖျက်"]].map(([val,label]) => (
            <button key={val} onClick={() => setFilter(val)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all
                ${filter === val ? "bg-primary-500 text-white" : "bg-white text-gray-500 border border-gray-200"}`}>
              {label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-3xl mb-2">📋</p>
            <p className="text-gray-400 text-sm">မှတ်တမ်း မရှိသေးပါ</p>
          </div>
        ) : (
          <div className="px-4 space-y-3">
            {filtered.map(order => (
              <div key={order.id} className="card cursor-pointer active:scale-[0.98] transition-all"
                onClick={() => setSelected(order)}>
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <span className="text-xs font-bold text-gray-400">#{order.id?.slice(-6).toUpperCase()}</span>
                    {order.status === "delivered" && (
                      <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-600 font-semibold">ပို့ပြီး</span>
                    )}
                    {order.status === "cancelled" && (
                      <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-500 font-semibold">ပယ်ဖျက်</span>
                    )}
                  </div>
                  <span className="text-xs text-gray-400">{timeAgo(order.createdAt)}</span>
                </div>

                <div className="space-y-1 mb-2">
                  <p className="text-xs text-gray-600">📦 {order.pickup?.address}</p>
                  <p className="text-xs text-gray-600">🎯 {order.dropoff?.address}</p>
                  <p className="text-xs text-gray-400">🏷️ {order.itemTypeLabel || order.itemType} · 👤 {order.customerName}</p>
                </div>

                <div className="bg-gray-50 rounded-xl p-2 flex justify-between items-center">
                  <span className="text-xs text-gray-400">🏍️ ရရှိသည်</span>
                  <span className="font-display font-black text-green-600 text-sm">
                    {Number(order.riderNet||0).toLocaleString()} ကျပ်
                  </span>
                </div>

                <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-100">
                  {order.rating && <span className="text-sm">{"⭐".repeat(order.rating)}</span>}
                  <span className="ml-auto text-xs text-gray-300">Details →</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <BottomNav />
      {selected && <OrderDetailModal order={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}
