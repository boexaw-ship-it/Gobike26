// src/pages/customer/TrackOrder.jsx
import { useState, useEffect } from "react"
import { collection, query, where, onSnapshot } from "firebase/firestore"
import { db } from "../../firebase/config"
import { useAuth } from "../../context/AuthContext"
import { useNavigate } from "react-router-dom"
import Navbar from "../../components/common/Navbar"
import BottomNav from "../../components/common/BottomNav"
import MapView from "../../components/map/MapView"

const STEPS = [
  { key: "pending",   label: "Order တင်ပြီ",     icon: "📦" },
  { key: "accepted",  label: "Rider လက်ခံပြီ",   icon: "🏍️" },
  { key: "picked_up", label: "သယ်ဆောင်နေသည်",   icon: "🚴" },
  { key: "delivered", label: "ပို့ပြီး",           icon: "✅" },
]

export default function TrackOrder() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [activeOrders, setActiveOrders] = useState([])
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    const q = query(
      collection(db, "orders"),
      where("customerId", "==", user.uid),
      where("status", "in", ["pending", "accepted", "picked_up"])
    )
    const unsub = onSnapshot(q, snap => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      data.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
      setActiveOrders(data)
      if (data.length > 0 && !selectedOrder) setSelectedOrder(data[0])
      else if (data.length > 0 && selectedOrder) {
        const updated = data.find(o => o.id === selectedOrder.id)
        if (updated) setSelectedOrder(updated)
      }
      setLoading(false)
    })
    return () => unsub()
  }, [user])

  const currentStepIndex = selectedOrder
    ? STEPS.findIndex(s => s.key === selectedOrder.status)
    : 0

  const timeAgo = (ts) => {
    if (!ts) return ""
    const d = ts.toDate ? ts.toDate() : new Date(ts)
    const diff = Math.floor((Date.now() - d) / 1000)
    if (diff < 60) return "ခုနက"
    if (diff < 3600) return `${Math.floor(diff/60)} မိနစ်က`
    return `${Math.floor(diff/3600)} နာရီက`
  }

  return (
    <div className="flex flex-col h-screen bg-surface">
      <Navbar title="Track Order" />
      <div className="flex-1 overflow-y-auto pb-24">

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : activeOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 px-6">
            <p className="text-4xl mb-3">📍</p>
            <p className="text-gray-400 text-sm text-center">Active order မရှိသေးပါ</p>
            <button onClick={() => navigate("/customer/order")} className="btn-primary mt-4 w-auto px-6">
              Order တင်မည်
            </button>
          </div>
        ) : (
          <>
            {/* Map */}
            <div className="h-64 relative">
              <MapView
                pickupPoint={selectedOrder?.pickup}
                dropoffPoint={selectedOrder?.dropoff}
                height="100%"
              />
              <div className="absolute top-3 right-3 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                LIVE
              </div>
            </div>

            {/* Multiple orders selector */}
            {activeOrders.length > 1 && (
              <div className="px-4 pt-3 flex gap-2 overflow-x-auto">
                {activeOrders.map(order => (
                  <button key={order.id}
                    onClick={() => setSelectedOrder(order)}
                    className={`shrink-0 text-xs px-3 py-2 rounded-full font-bold transition-all
                      ${selectedOrder?.id === order.id
                        ? "bg-primary-500 text-white"
                        : "bg-white text-gray-500 border border-gray-200"}`}>
                    #{order.id?.slice(-6).toUpperCase()}
                  </button>
                ))}
              </div>
            )}

            {selectedOrder && (
              <>
                {/* Status Card */}
                <div className="px-4 mt-3">
                  <div className="card">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-xs text-gray-400">Order #{selectedOrder.id?.slice(-6).toUpperCase()}</p>
                        <p className="text-lg font-display font-black text-primary-500">
                          {selectedOrder.deliveryFee?.toLocaleString()} ကျပ်
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">{timeAgo(selectedOrder.createdAt)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-400">💳 {selectedOrder.paymentType === "cod" ? "Cash on Delivery" : "Cash Pay"}</p>
                      </div>
                    </div>

                    {/* Progress Steps */}
                    <div className="flex items-center justify-between">
                      {STEPS.map((step, i) => (
                        <div key={step.key} className="flex items-center flex-1">
                          <div className="flex flex-col items-center">
                            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-base border-2 transition-all
                              ${i <= currentStepIndex
                                ? "bg-primary-500 border-primary-500 text-white"
                                : "bg-white border-gray-200 text-gray-300"}`}>
                              {i <= currentStepIndex ? step.icon : i + 1}
                            </div>
                            <p className="text-[9px] text-gray-400 mt-1 text-center w-16 leading-tight">{step.label}</p>
                          </div>
                          {i < STEPS.length - 1 && (
                            <div className={`flex-1 h-0.5 mx-1 mb-5 transition-all
                              ${i < currentStepIndex ? "bg-primary-500" : "bg-gray-200"}`} />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Rider Info */}
                {selectedOrder.riderName && (
                  <div className="px-4 mt-3">
                    <div className="card">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-primary-100 rounded-2xl flex items-center justify-center text-2xl">🏍️</div>
                        <div className="flex-1">
                          <p className="font-display font-bold text-dark text-sm">{selectedOrder.riderName}</p>
                          <p className="text-xs text-gray-400">Rider လာနေသည် 🚴</p>
                        </div>
                        {selectedOrder.riderPhone && (
                          <a href={`tel:${selectedOrder.riderPhone}`}
                            className="w-10 h-10 bg-primary-500 rounded-2xl flex items-center justify-center text-white shadow-primary">
                            📞
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Pending - no rider yet */}
                {selectedOrder.status === "pending" && (
                  <div className="px-4 mt-3">
                    <div className="card text-center py-4">
                      <div className="flex justify-center gap-1 mb-2">
                        {[0,1,2].map(i => (
                          <div key={i} className="w-2 h-2 bg-primary-500 rounded-full animate-bounce"
                            style={{ animationDelay: `${i * 0.2}s` }} />
                        ))}
                      </div>
                      <p className="text-sm text-gray-500">Rider ရှာနေသည်...</p>
                    </div>
                  </div>
                )}

                {/* Route Info */}
                <div className="px-4 mt-3">
                  <div className="card">
                    <p className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wider">Route</p>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">📦</div>
                        <div>
                          <p className="text-xs text-gray-400">ယူမည့်နေရာ</p>
                          <p className="text-sm font-semibold text-gray-700">{selectedOrder.pickup?.address}</p>
                        </div>
                      </div>
                      <div className="ml-4 w-px h-4 bg-gray-200" />
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">🎯</div>
                        <div>
                          <p className="text-xs text-gray-400">ပို့မည့်နေရာ</p>
                          <p className="text-sm font-semibold text-gray-700">{selectedOrder.dropoff?.address}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Item Info */}
                <div className="px-4 mt-3 mb-2">
                  <div className="card">
                    <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider">ပစ္စည်းအချက်အလက်</p>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-400">ပစ္စည်းအမျိုး</span>
                        <span className="font-semibold">{selectedOrder.itemTypeLabel}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-400">ပစ္စည်းတန်ဖိုး</span>
                        <span className="font-semibold">{selectedOrder.itemValue?.toLocaleString()} ကျပ်</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-400">ဆက်သွယ်ရန်</span>
                        <span className="font-semibold">{selectedOrder.customerPhone}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </div>
      <BottomNav />
    </div>
  )
}
