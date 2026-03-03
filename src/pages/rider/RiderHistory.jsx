// src/pages/rider/RiderHistory.jsx
import { useState, useEffect } from "react"
import { collection, query, where, onSnapshot, doc, updateDoc, deleteDoc, serverTimestamp } from "firebase/firestore"
import { db } from "../../firebase/config"
import { useAuth } from "../../context/AuthContext"
import Navbar from "../../components/common/Navbar"
import BottomNav from "../../components/common/BottomNav"

function OrderDetailModal({ order, onClose, onCancel, onDelete, cancelling, deleting }) {
  const riderEarned = order.riderNet || 0
  const canCancel   = order.status === "accepted"
  const canDelete   = order.status === "delivered" || order.status === "cancelled"

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
      <div className="bg-white w-full rounded-t-3xl px-6 py-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-display font-black text-dark">
            Order #{order.id?.slice(-6).toUpperCase()}
          </h3>
          <button onClick={onClose} className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-500">✕</button>
        </div>

        {/* Status badge */}
        {{
          pending:   <span className="inline-block mb-4 text-xs px-3 py-1 rounded-full bg-yellow-100 text-yellow-600 font-semibold">⏳ Pending</span>,
          accepted:  <span className="inline-block mb-4 text-xs px-3 py-1 rounded-full bg-blue-100 text-blue-600 font-semibold">🏍️ Rider လာနေသည်</span>,
          picked_up: <span className="inline-block mb-4 text-xs px-3 py-1 rounded-full bg-purple-100 text-purple-600 font-semibold">📦 သယ်ဆောင်နေသည်</span>,
          delivered: <span className="inline-block mb-4 text-xs px-3 py-1 rounded-full bg-green-100 text-green-600 font-semibold">✅ ပို့ပြီး</span>,
          cancelled: <span className="inline-block mb-4 text-xs px-3 py-1 rounded-full bg-red-100 text-red-500 font-semibold">❌ ပယ်ဖျက်</span>,
        }[order.status]}

        {/* Route */}
        <div className="card mb-3 space-y-3">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Route</p>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">📦</div>
            <div>
              <p className="text-xs text-gray-400">ယူမည့်နေရာ</p>
              <p className="text-sm font-semibold">{order.pickup?.address}</p>
            </div>
          </div>
          <div className="w-px h-3 bg-gray-200 ml-4" />
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">🎯</div>
            <div>
              <p className="text-xs text-gray-400">ပို့မည့်နေရာ</p>
              <p className="text-sm font-semibold">{order.dropoff?.address}</p>
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="card mb-3 space-y-2">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">အသေးစိတ်</p>
          {[
            ["ပစ္စည်းအမျိုး", order.itemTypeLabel || order.itemType],
            ["ပစ္စည်းတန်ဖိုး", `${Number(order.itemValue||0).toLocaleString()} ကျပ်`],
            ["Customer", order.customerName],
            ["ဖုန်း", order.customerPhone],
            ["ငွေပေးချေမှု", order.paymentType === "cod" ? "💵 COD" : "✅ Cash"],
            ...(order.note ? [["မှတ်ချက်", order.note]] : []),
            ...(order.rating ? [["Rating", "⭐".repeat(order.rating)]] : []),
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between text-xs">
              <span className="text-gray-400">{k}</span>
              <span className="font-semibold text-right max-w-[60%]">{v}</span>
            </div>
          ))}
        </div>

        {/* Fee */}
        <div className="bg-gray-50 rounded-2xl p-4 space-y-2 mb-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">ငွေစာရင်း</p>
          <div className="flex justify-between text-xs">
            <span className="text-gray-500">🚚 Delivery Fee</span>
            <span className="font-semibold">{Number(order.deliveryFee||0).toLocaleString()} ကျပ်</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-gray-500">📊 Commission (10%)</span>
            <span className="text-red-500">- {Number(order.commission||0).toLocaleString()} ကျပ်</span>
          </div>
          <div className="border-t border-gray-200 pt-2 flex justify-between">
            <span className="text-sm font-bold text-gray-700">🏍️ Rider ရရှိသည်</span>
            <span className="text-lg font-display font-black text-green-600">{riderEarned.toLocaleString()} ကျပ်</span>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-2">
          {canCancel && (
            <button onClick={onCancel} disabled={cancelling}
              className="w-full py-3 rounded-2xl bg-red-50 text-red-500 font-bold text-sm disabled:opacity-50">
              {cancelling ? "ပယ်ဖျက်နေသည်..." : "❌ Order ပယ်ဖျက်မည်"}
            </button>
          )}
          {canDelete && (
            <button onClick={onDelete} disabled={deleting}
              className="w-full py-3 rounded-2xl bg-gray-100 text-gray-500 font-bold text-sm disabled:opacity-50">
              {deleting ? "ဖျက်နေသည်..." : "🗑️ မှတ်တမ်းဖျက်မည်"}
            </button>
          )}
          <button onClick={onClose} className="btn-primary">ပိတ်မည်</button>
        </div>
      </div>
    </div>
  )
}

export default function RiderHistory() {
  const { user } = useAuth()
  const [orders, setOrders]     = useState([])
  const [loading, setLoading]   = useState(true)
  const [selected, setSelected] = useState(null)
  const [filter, setFilter]     = useState("all")
  const [cancelling, setCancelling] = useState(false)
  const [deleting, setDeleting]     = useState(false)

  useEffect(() => {
    if (!user) return
    const q = query(collection(db, "orders"), where("riderId", "==", user.uid))
    const unsub = onSnapshot(q, snap => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      data.sort((a, b) => (b.createdAt?.seconds||0) - (a.createdAt?.seconds||0))
      setOrders(data)
      setLoading(false)
      // update selected if open
      if (selected) {
        const upd = data.find(o => o.id === selected.id)
        setSelected(upd || null)
      }
    })
    return () => unsub()
  }, [user])

  const handleCancel = async () => {
    if (!selected) return
    if (!confirm("Order ကို ပယ်ဖျက်မည်လား?")) return
    setCancelling(true)
    try {
      await updateDoc(doc(db, "orders", selected.id), {
        status: "cancelled", cancelledAt: serverTimestamp(), cancelledBy: "rider"
      })
      setSelected(null)
    } catch (e) { alert("Error: " + e.message) }
    finally { setCancelling(false) }
  }

  const handleDelete = async () => {
    if (!selected) return
    if (!confirm("မှတ်တမ်းကို ဖျက်မည်လား?")) return
    setDeleting(true)
    try {
      await deleteDoc(doc(db, "orders", selected.id))
      setSelected(null)
    } catch (e) { alert("Error: " + e.message) }
    finally { setDeleting(false) }
  }

  const filtered = {
    all:       orders,
    delivered: orders.filter(o => o.status === "delivered"),
    active:    orders.filter(o => ["accepted","picked_up"].includes(o.status)),
    cancelled: orders.filter(o => o.status === "cancelled"),
  }[filter] || orders

  const totalEarned = orders
    .filter(o => o.status === "delivered")
    .reduce((s, o) => s + (o.riderNet||0), 0)

  const timeAgo = (ts) => {
    if (!ts) return ""
    const d = ts.toDate ? ts.toDate() : new Date(ts)
    const diff = Math.floor((Date.now() - d) / 1000)
    if (diff < 60)    return "ခုနက"
    if (diff < 3600)  return `${Math.floor(diff/60)} မိနစ်က`
    if (diff < 86400) return `${Math.floor(diff/3600)} နာရီက`
    return `${Math.floor(diff/86400)} ရက်က`
  }

  const statusStyle = {
    delivered: "bg-green-100 text-green-600",
    accepted:  "bg-blue-100 text-blue-600",
    picked_up: "bg-purple-100 text-purple-600",
    cancelled: "bg-red-100 text-red-500",
    pending:   "bg-gray-100 text-gray-500",
  }
  const statusText = {
    delivered: "✅ ပို့ပြီး",
    accepted:  "🏍️ လာနေသည်",
    picked_up: "📦 သယ်ဆောင်",
    cancelled: "❌ ပယ်ဖျက်",
    pending:   "⏳ Pending",
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

        {/* Filter tabs */}
        <div className="px-4 mb-3 flex gap-2 overflow-x-auto">
          {[
            ["all",       "အားလုံး"],
            ["active",    "လုပ်ဆောင်နေ"],
            ["delivered", "ပို့ပြီး"],
            ["cancelled", "ပယ်ဖျက်"],
          ].map(([val, label]) => (
            <button key={val} onClick={() => setFilter(val)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all
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
                    <span className={`ml-2 text-xs px-2 py-0.5 rounded-full font-semibold ${statusStyle[order.status]}`}>
                      {statusText[order.status]}
                    </span>
                  </div>
                  <span className="text-xs text-gray-400">{timeAgo(order.createdAt)}</span>
                </div>

                <div className="space-y-0.5 mb-2">
                  <p className="text-xs text-gray-600 truncate">📦 {order.pickup?.address}</p>
                  <p className="text-xs text-gray-600 truncate">🎯 {order.dropoff?.address}</p>
                  <p className="text-xs text-gray-400">👤 {order.customerName} · 🏷️ {order.itemTypeLabel}</p>
                </div>

                <div className="flex justify-between items-center bg-gray-50 rounded-xl px-3 py-2">
                  <span className="text-xs text-gray-400">🏍️ ရရှိသည်</span>
                  <span className="font-display font-black text-green-600">
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

      {selected && (
        <OrderDetailModal
          order={selected}
          onClose={() => setSelected(null)}
          onCancel={handleCancel}
          onDelete={handleDelete}
          cancelling={cancelling}
          deleting={deleting}
        />
      )}
    </div>
  )
}
