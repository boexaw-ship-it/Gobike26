// src/pages/customer/CustomerHistory.jsx
import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { collection, query, where, onSnapshot, doc, updateDoc, deleteDoc } from "firebase/firestore"
import { db } from "../../firebase/config"
import { useAuth } from "../../context/AuthContext"
import Navbar from "../../components/common/Navbar"
import BottomNav from "../../components/common/BottomNav"

const STATUS_LABEL = {
  pending:   { label: "စောင့်ဆိုင်းနေ",  color: "bg-yellow-100 text-yellow-600" },
  accepted:  { label: "Rider လာနေသည်",  color: "bg-blue-100 text-blue-600" },
  picked_up: { label: "သယ်ဆောင်နေသည်", color: "bg-purple-100 text-purple-600" },
  delivered: { label: "ပို့ပြီး",          color: "bg-green-100 text-green-600" },
  cancelled: { label: "ပယ်ဖျက်ထား",      color: "bg-red-100 text-red-600" },
}

function RatingModal({ order, onClose, onSubmit }) {
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState("")
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
      <div className="bg-white w-full rounded-t-3xl px-6 py-6">
        <h3 className="text-lg font-display font-black text-dark mb-1">Rating ပေးမည်</h3>
        <p className="text-xs text-gray-400 mb-4">{order.riderName || "Rider"} အား Rating ပေးပါ</p>
        <div className="flex justify-center gap-3 mb-4">
          {[1,2,3,4,5].map(s => (
            <button key={s} onClick={() => setRating(s)}
              className={`text-3xl transition-all ${s <= rating ? "opacity-100" : "opacity-30"}`}>⭐</button>
          ))}
        </div>
        <textarea rows={3} placeholder="မှတ်ချက် (ရှိလျှင်)" value={comment}
          onChange={e => setComment(e.target.value)} className="input-field resize-none mb-4" />
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-4 rounded-2xl border border-gray-200 font-bold text-gray-500">ကျော်မည်</button>
          <button onClick={() => onSubmit(rating, comment)} className="flex-[2] btn-primary">⭐ Rating ပေးမည်</button>
        </div>
      </div>
    </div>
  )
}

// Order detail popup
function OrderDetailModal({ order, onClose }) {
  const itemType = order.itemTypeLabel || order.itemType || "-"
  const total = order.total || (Number(order.itemValue || 0) + Number(order.deliveryFee || 0))
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
      <div className="bg-white w-full rounded-t-3xl px-6 py-6 max-h-[85vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-display font-black text-dark">
            Order #{order.id?.slice(-6).toUpperCase()}
          </h3>
          <button onClick={onClose} className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-500">✕</button>
        </div>

        {/* Status */}
        <div className={`inline-block text-xs px-3 py-1 rounded-full font-semibold mb-4 ${STATUS_LABEL[order.status]?.color}`}>
          {STATUS_LABEL[order.status]?.label}
        </div>

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

        {/* Item Details */}
        <div className="card mb-3 space-y-2">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">ပစ္စည်းအချက်အလက်</p>
          <div className="flex justify-between text-xs">
            <span className="text-gray-400">ပစ္စည်းအမျိုး</span>
            <span className="font-semibold">{itemType}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-gray-400">ပစ္စည်းတန်ဖိုး</span>
            <span className="font-semibold">{Number(order.itemValue || 0).toLocaleString()} ကျပ်</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-gray-400">ဆက်သွယ်ရန် ဖုန်း</span>
            <span className="font-semibold">{order.customerPhone}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-gray-400">ငွေပေးချေမှု</span>
            <span className="font-semibold">{order.paymentType === "cod" ? "💵 Cash on Delivery" : "✅ Cash Pay"}</span>
          </div>
          {order.note ? (
            <div className="flex justify-between text-xs">
              <span className="text-gray-400">မှတ်ချက်</span>
              <span className="font-semibold text-right max-w-[60%]">{order.note}</span>
            </div>
          ) : null}
        </div>

        {/* Rider */}
        {order.riderName && (
          <div className="card mb-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Rider</p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary-100 rounded-2xl flex items-center justify-center text-xl">🏍️</div>
              <div>
                <p className="text-sm font-semibold">{order.riderName}</p>
                {order.rating && <p className="text-xs text-yellow-500">{"⭐".repeat(order.rating)}</p>}
              </div>
            </div>
          </div>
        )}

        {/* Fee Summary */}
        <div className="bg-gray-50 rounded-2xl p-4 space-y-2 mb-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">ငွေစာရင်း</p>
          <div className="flex justify-between text-xs">
            <span className="text-gray-500">💎 ပစ္စည်းတန်ဖိုး</span>
            <span className="font-semibold">{Number(order.itemValue || 0).toLocaleString()} ကျပ်</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-gray-500">🚚 Delivery Fee</span>
            <span className="font-semibold">{Number(order.deliveryFee || 0).toLocaleString()} ကျပ်</span>
          </div>
          <div className="border-t border-gray-200 pt-2 flex justify-between items-center">
            <span className="text-sm font-bold text-gray-700">💰 Total</span>
            <span className="text-xl font-display font-black text-primary-500">{total.toLocaleString()} ကျပ်</span>
          </div>
        </div>

        <button onClick={onClose} className="btn-primary">ပိတ်မည်</button>
      </div>
    </div>
  )
}

export default function CustomerHistory() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [ratingOrder, setRatingOrder] = useState(null)
  const [detailOrder, setDetailOrder] = useState(null)
  const [cancellingId, setCancellingId] = useState(null)
  const [deletingId, setDeletingId] = useState(null)

  useEffect(() => {
    if (!user) return
    const q = query(collection(db, "orders"), where("customerId", "==", user.uid))
    const unsub = onSnapshot(q, snap => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      data.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
      setOrders(data)
      setLoading(false)
      // detail popup update
      if (detailOrder) {
        const updated = data.find(o => o.id === detailOrder.id)
        if (updated) setDetailOrder(updated)
      }
    })
    return () => unsub()
  }, [user])

  const handleRating = async (rating, comment) => {
    await updateDoc(doc(db, "orders", ratingOrder.id), { rating, ratingComment: comment, ratedAt: new Date() })
    setRatingOrder(null)
  }

  const handleCancel = async (orderId) => {
    if (!confirm("Order ကို ပယ်ဖျက်မည်လား?")) return
    setCancellingId(orderId)
    try {
      await updateDoc(doc(db, "orders", orderId), { status: "cancelled", cancelledAt: new Date(), cancelledBy: "customer" })
    } finally { setCancellingId(null) }
  }

  const handleDelete = async (orderId) => {
    if (!confirm("Order မှတ်တမ်းကို ဖျက်မည်လား?")) return
    setDeletingId(orderId)
    try {
      await deleteDoc(doc(db, "orders", orderId))
      setDetailOrder(null)
    } finally { setDeletingId(null) }
  }

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
      <Navbar title="Order မှတ်တမ်း" />
      <div className="flex-1 overflow-y-auto pb-24 px-4 pt-4">
        {loading ? (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-gray-400 text-sm">Loading...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-4xl mb-3">📋</p>
            <p className="text-gray-400 text-sm">Order မှတ်တမ်း မရှိသေးပါ</p>
            <button onClick={() => navigate("/customer/order")} className="btn-primary mt-4 w-auto px-6">
              Order ပထမဆုံး တင်မည်
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map(order => {
              const status = STATUS_LABEL[order.status] || STATUS_LABEL.pending
              const total = order.total || (Number(order.itemValue || 0) + Number(order.deliveryFee || 0))
              return (
                <div key={order.id} className="card cursor-pointer active:scale-[0.98] transition-all"
                  onClick={() => setDetailOrder(order)}>
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className="text-xs font-bold text-gray-400">#{order.id?.slice(-6).toUpperCase()}</span>
                      <span className={`ml-2 text-xs px-2 py-0.5 rounded-full font-semibold ${status.color}`}>
                        {status.label}
                      </span>
                    </div>
                    <span className="text-xs text-gray-400">{timeAgo(order.createdAt)}</span>
                  </div>

                  <div className="space-y-1 mb-2">
                    <p className="text-xs text-gray-600">📦 {order.pickup?.address}</p>
                    <p className="text-xs text-gray-600">🎯 {order.dropoff?.address}</p>
                    <p className="text-xs text-gray-400">🏷️ {order.itemTypeLabel || order.itemType}</p>
                  </div>

                  {/* Total */}
                  <div className="bg-gray-50 rounded-xl p-2 mb-3 flex justify-between items-center">
                    <span className="text-xs text-gray-400">💰 Total</span>
                    <span className="text-sm font-display font-black text-primary-500">{total.toLocaleString()} ကျပ်</span>
                  </div>

                  <div className="flex items-center border-t border-gray-100 pt-2 gap-2 flex-wrap"
                    onClick={e => e.stopPropagation()}>
                    {order.status === "pending" && (
                      <button onClick={() => handleCancel(order.id)}
                        disabled={cancellingId === order.id}
                        className="text-xs bg-red-50 text-red-500 font-bold px-3 py-1.5 rounded-full">
                        {cancellingId === order.id ? "..." : "❌ Cancel"}
                      </button>
                    )}
                    {order.status === "delivered" && !order.rating && (
                      <button onClick={() => setRatingOrder(order)}
                        className="text-xs bg-yellow-100 text-yellow-600 font-bold px-3 py-1.5 rounded-full">
                        ⭐ Rating ပေး
                      </button>
                    )}
                    {order.rating && (
                      <span className="text-sm">{"⭐".repeat(order.rating)}</span>
                    )}
                    {(order.status === "delivered" || order.status === "cancelled") && (
                      <button onClick={() => handleDelete(order.id)}
                        disabled={deletingId === order.id}
                        className="ml-auto text-xs bg-gray-100 text-gray-400 font-bold px-3 py-1.5 rounded-full">
                        {deletingId === order.id ? "..." : "🗑️ ဖျက်"}
                      </button>
                    )}
                    <span className="ml-auto text-xs text-gray-300">Details →</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <BottomNav />

      {detailOrder && (
        <OrderDetailModal order={detailOrder} onClose={() => setDetailOrder(null)} />
      )}
      {ratingOrder && (
        <RatingModal order={ratingOrder} onClose={() => setRatingOrder(null)} onSubmit={handleRating} />
      )}
    </div>
  )
}
