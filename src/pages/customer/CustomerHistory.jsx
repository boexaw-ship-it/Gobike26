// src/pages/customer/CustomerHistory.jsx
import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc } from "firebase/firestore"
import { db } from "../../firebase/config"
import { useAuth } from "../../context/AuthContext"
import Navbar from "../../components/common/Navbar"
import BottomNav from "../../components/common/BottomNav"

const STATUS_LABEL = {
  pending:   { label: "စောင့်ဆိုင်းနေ",    color: "bg-yellow-100 text-yellow-600" },
  accepted:  { label: "Rider လာနေသည်",   color: "bg-blue-100 text-blue-600" },
  picked_up: { label: "သယ်ဆောင်နေသည်",   color: "bg-purple-100 text-purple-600" },
  delivered: { label: "ပို့ပြီး",           color: "bg-green-100 text-green-600" },
  cancelled: { label: "ပယ်ဖျက်ထား",       color: "bg-red-100 text-red-600" },
}

function RatingModal({ order, onClose, onSubmit }) {
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState("")
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
      <div className="bg-white w-full rounded-t-3xl px-6 py-6 animate-slide-up">
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
          <button onClick={() => onSubmit(rating, comment)} className="flex-[2] btn-primary">Rating ပေးမည် ⭐</button>
        </div>
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

  useEffect(() => {
    if (!user) return
    const q = query(
      collection(db, "orders"),
      where("customerId", "==", user.uid),
      orderBy("createdAt", "desc")
    )
    const unsub = onSnapshot(q, snap => {
      setOrders(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      setLoading(false)
    })
    return () => unsub()
  }, [user])

  const handleRating = async (rating, comment) => {
    await updateDoc(doc(db, "orders", ratingOrder.id), {
      rating, ratingComment: comment, ratedAt: new Date()
    })
    setRatingOrder(null)
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
          <div className="text-center py-12 text-gray-400">Loading...</div>
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
              return (
                <div key={order.id} className="card">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className="text-xs font-bold text-gray-400">#{order.id?.slice(-6).toUpperCase()}</span>
                      <span className={`ml-2 text-xs px-2 py-0.5 rounded-full font-semibold ${status.color}`}>
                        {status.label}
                      </span>
                    </div>
                    <span className="text-xs text-gray-400">{timeAgo(order.createdAt)}</span>
                  </div>

                  <div className="space-y-1 mb-3">
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <span>📦</span><span>{order.pickup?.address}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <span>🎯</span><span>{order.dropoff?.address}</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center border-t border-gray-100 pt-2">
                    <span className="text-sm font-display font-black text-primary-500">
                      {order.deliveryFee?.toLocaleString()} ကျပ်
                    </span>
                    {order.status === "delivered" && !order.rating && (
                      <button onClick={() => setRatingOrder(order)}
                        className="text-xs bg-yellow-100 text-yellow-600 font-bold px-3 py-1 rounded-full">
                        ⭐ Rating ပေး
                      </button>
                    )}
                    {order.rating && (
                      <div className="flex items-center gap-1">
                        {"⭐".repeat(order.rating)}
                        <span className="text-xs text-gray-400">{order.rating}/5</span>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
      <BottomNav />
      {ratingOrder && (
        <RatingModal order={ratingOrder} onClose={() => setRatingOrder(null)} onSubmit={handleRating} />
      )}
    </div>
  )
}
