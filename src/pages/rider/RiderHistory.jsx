// src/pages/rider/RiderHistory.jsx
import { useState, useEffect } from "react"
import { collection, query, where, onSnapshot, doc, updateDoc, deleteDoc, serverTimestamp } from "firebase/firestore"
import { db } from "../../firebase/config"
import { useAuth } from "../../context/AuthContext"
import Navbar from "../../components/common/Navbar"
import BottomNav from "../../components/common/BottomNav"
import Toast from "../../components/common/Toast"

async function sendCancelTelegram(order, cancelledBy) {
  const BOT  = import.meta.env.VITE_TELEGRAM_BOT_TOKEN
  const CHAT = import.meta.env.VITE_TELEGRAM_ADMIN_CHAT_ID
  if (!BOT || !CHAT) return
  const time = new Date().toLocaleString("en-GB", {
    day:"2-digit", month:"2-digit", year:"numeric",
    hour:"2-digit", minute:"2-digit", hour12:true,
  })
  const text = `❌ <b>Order ပယ်ဖျက်ပြီ!</b>
━━━━━━━━━━━━━━━━
📦 <b>Order #${order.id?.slice(-6).toUpperCase()}</b>
⏰ <b>အချိန်:</b> ${time}
━━━━━━━━━━━━━━━━
👤 <b>Customer:</b> ${order.customerName}
🏍️ <b>Rider:</b> ${order.riderName || "-"}
📍 ${order.pickup?.address}
🎯 ${order.dropoff?.address}
🚚 <b>Delivery Fee:</b> ${Number(order.deliveryFee||0).toLocaleString()} ကျပ်
━━━━━━━━━━━━━━━━
🚫 <b>ပယ်ဖျက်သူ:</b> ${cancelledBy === "customer" ? "👤 Customer" : "🏍️ Rider"}`
  await fetch(`https://api.telegram.org/bot${BOT}/sendMessage`, {
    method:"POST", headers:{"Content-Type":"application/json"},
    body: JSON.stringify({ chat_id: CHAT, text, parse_mode:"HTML" }),
  }).catch(() => {})
}

function OrderDetailModal({ order, onClose, onCancel, onDelete, cancelling, deleting }) {
  const canCancel = order.status === "accepted"
  const canDelete = ["delivered","cancelled"].includes(order.status)
  const total     = Number(order.itemValue||0) + Number(order.deliveryFee||0)

  const statusStyle = {
    pending:  "bg-yellow-100 text-yellow-600",
    accepted: "bg-blue-100 text-blue-600",
    picked_up:"bg-purple-100 text-purple-600",
    delivered:"bg-green-100 text-green-600",
    cancelled:"bg-red-100 text-red-500",
  }
  const statusText = {
    pending:"⏳ Pending", accepted:"🏍️ လာနေသည်",
    picked_up:"📦 သယ်ဆောင်", delivered:"✅ ပို့ပြီး", cancelled:"❌ ပယ်ဖျက်",
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
      <div className="bg-white w-full rounded-t-3xl px-6 py-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-lg font-display font-black">Order #{order.id?.slice(-6).toUpperCase()}</h3>
          <button onClick={onClose} className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-500">✕</button>
        </div>
        <span className={`inline-block text-xs px-3 py-1 rounded-full font-semibold mb-4 ${statusStyle[order.status]}`}>
          {statusText[order.status]}
        </span>
        {/* Route */}
        <div className="card mb-3 space-y-2">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Route</p>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">📦</div>
            <div><p className="text-xs text-gray-400">ယူမည့်နေရာ</p><p className="text-sm font-semibold">{order.pickup?.address}</p></div>
          </div>
          <div className="w-px h-3 bg-gray-200 ml-4" />
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">🎯</div>
            <div><p className="text-xs text-gray-400">ပို့မည့်နေရာ</p><p className="text-sm font-semibold">{order.dropoff?.address}</p></div>
          </div>
        </div>
        {/* Item info */}
        <div className="card mb-3 space-y-2">
          {[
            ["ပစ္စည်းအမျိုး", order.itemTypeLabel||order.itemType],
            ["ပစ္စည်းတန်ဖိုး", `${Number(order.itemValue||0).toLocaleString()} ကျပ်`],
            ["Customer", order.customerName],
            ["ဖုန်း", order.customerPhone],
            ["ငွေပေးချေ", order.paymentType==="cod" ? "💵 COD" : "✅ Cash"],
            ...(order.note ? [["မှတ်ချက်", order.note]] : []),
            ...(order.rating ? [["Rating", "⭐".repeat(order.rating)]] : []),
          ].map(([k,v]) => (
            <div key={k} className="flex justify-between text-xs">
              <span className="text-gray-400">{k}</span>
              <span className="font-semibold text-right max-w-[60%]">{v}</span>
            </div>
          ))}
        </div>
        {/* Fee */}
        <div className="bg-gray-50 rounded-2xl p-4 space-y-1.5 mb-4">
          <div className="flex justify-between text-xs"><span className="text-gray-500">💎 ပစ္စည်းတန်ဖိုး</span><span className="font-semibold">{Number(order.itemValue||0).toLocaleString()} ကျပ်</span></div>
          <div className="flex justify-between text-xs"><span className="text-gray-500">🚚 Delivery Fee</span><span className="font-semibold">{Number(order.deliveryFee||0).toLocaleString()} ကျပ်</span></div>
          <div className="flex justify-between text-xs border-t pt-1.5"><span className="font-bold text-gray-700">💰 Total</span><span className="font-bold">{total.toLocaleString()} ကျပ်</span></div>
          <div className="flex justify-between text-xs"><span className="text-gray-500">📊 Commission (10%)</span><span className="text-red-500">- {Number(order.commission||0).toLocaleString()} ကျပ်</span></div>
          <div className="flex justify-between border-t pt-1.5">
            <span className="text-sm font-bold text-gray-700">🏍️ ရရှိသည်</span>
            <span className="text-lg font-display font-black text-green-600">{Number(order.riderNet||0).toLocaleString()} ကျပ်</span>
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
  const [toast, setToast]           = useState(null)

  const showToast = (msg, type="success") => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  useEffect(() => {
    if (!user) return
    const q = query(collection(db, "orders"), where("riderId", "==", user.uid))
    const unsub = onSnapshot(q, snap => {
      const data = snap.docs.map(d => ({ id:d.id, ...d.data() }))
      data.sort((a,b) => (b.createdAt?.seconds||0) - (a.createdAt?.seconds||0))
      setOrders(data)
      setLoading(false)
      // update detail if open
      if (selected) {
        const upd = data.find(o => o.id === selected.id)
        setSelected(upd || null)
      }
    })
    return () => unsub()
  }, [user])

  const handleCancel = async () => {
    if (!selected) return
    setCancelling(true)
    try {
      await updateDoc(doc(db, "orders", selected.id), {
        status:"cancelled", cancelledAt:serverTimestamp(), cancelledBy:"rider"
      })
      await sendCancelTelegram(selected, "rider")
      showToast("Order ပယ်ဖျက်ပြီ ❌ — Telegram ပို့ပြီ", "warn")
      setSelected(null)
    } catch { showToast("Error ဖြစ်သည်", "error") }
    finally { setCancelling(false) }
  }

  const handleDelete = async () => {
    if (!selected) return
    setDeleting(true)
    try {
      await deleteDoc(doc(db, "orders", selected.id))
      showToast("မှတ်တမ်း ဖျက်ပြီ 🗑️", "info")
      setSelected(null)
    } catch { showToast("Error ဖြစ်သည်", "error") }
    finally { setDeleting(false) }
  }

  const filtered = {
    all:       orders,
    delivered: orders.filter(o => o.status==="delivered"),
    active:    orders.filter(o => ["accepted","picked_up"].includes(o.status)),
    cancelled: orders.filter(o => o.status==="cancelled"),
  }[filter] || orders

  const totalEarned = orders.filter(o=>o.status==="delivered").reduce((s,o)=>s+(o.riderNet||0),0)

  const timeAgo = (ts) => {
    if (!ts) return ""
    const d = ts.toDate ? ts.toDate() : new Date(ts)
    const diff = Math.floor((Date.now()-d)/1000)
    if (diff < 60) return "ခုနက"
    if (diff < 3600) return `${Math.floor(diff/60)} မိနစ်က`
    if (diff < 86400) return `${Math.floor(diff/3600)} နာရီက`
    return `${Math.floor(diff/86400)} ရက်က`
  }

  const statusStyle = {
    delivered:"bg-green-100 text-green-600", accepted:"bg-blue-100 text-blue-600",
    picked_up:"bg-purple-100 text-purple-600", cancelled:"bg-red-100 text-red-500", pending:"bg-gray-100 text-gray-500",
  }
  const statusText = {
    delivered:"✅ ပို့ပြီး", accepted:"🏍️ လာနေ", picked_up:"📦 သယ်", cancelled:"❌ ပယ်", pending:"⏳ Pending",
  }

  return (
    <div className="flex flex-col h-screen bg-surface">
      <Navbar title="Delivery မှတ်တမ်း" />
      {toast && <Toast message={toast.msg} type={toast.type} />}
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
        <div className="px-4 mb-3 flex gap-2 overflow-x-auto">
          {[["all","အားလုံး"],["active","လုပ်ဆောင်"],["delivered","ပို့ပြီး"],["cancelled","ပယ်ဖျက်"]].map(([v,l]) => (
            <button key={v} onClick={() => setFilter(v)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all
                ${filter===v ? "bg-primary-500 text-white" : "bg-white text-gray-500 border border-gray-200"}`}>
              {l}
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
                <p className="text-xs text-gray-600 truncate mb-0.5">📦 {order.pickup?.address}</p>
                <p className="text-xs text-gray-600 truncate mb-0.5">🎯 {order.dropoff?.address}</p>
                <p className="text-xs text-gray-400 mb-2">👤 {order.customerName} · 🏷️ {order.itemTypeLabel}</p>
                <div className="bg-gray-50 rounded-xl px-3 py-2 flex justify-between items-center">
                  <span className="text-xs text-gray-400">🏍️ ရရှိသည်</span>
                  <span className="font-display font-black text-green-600">{Number(order.riderNet||0).toLocaleString()} ကျပ်</span>
                </div>
                <div className="flex justify-between mt-2 pt-2 border-t border-gray-100">
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
        <OrderDetailModal order={selected} onClose={() => setSelected(null)}
          onCancel={handleCancel} onDelete={handleDelete}
          cancelling={cancelling} deleting={deleting} />
      )}
    </div>
  )
}
