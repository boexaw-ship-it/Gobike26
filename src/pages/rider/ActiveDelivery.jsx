// src/pages/rider/ActiveDelivery.jsx
import { useState, useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { collection, query, where, onSnapshot, doc, updateDoc, serverTimestamp } from "firebase/firestore"
import { db } from "../../firebase/config"
import { useAuth } from "../../context/AuthContext"
import { deductCommission } from "../../services/walletService"
import Navbar from "../../components/common/Navbar"
import BottomNav from "../../components/common/BottomNav"
import MapView from "../../components/map/MapView"

const STATUS_FLOW = [
  { key: "accepted",  icon: "✅", label: "Order လက်ခံပြီ",    action: "📦 ပစ္စည်းယူပြီ" },
  { key: "picked_up", icon: "📦", label: "ပစ္စည်းယူပြီ — သယ်ဆောင်နေသည်", action: "🎉 ပို့ဆောင်ပြီ" },
  { key: "delivered", icon: "🎉", label: "ပို့ဆောင်ပြီးပြီ!", action: null },
]

async function sendTelegramStatus(order, status, rider) {
  const BOT_TOKEN = import.meta.env.VITE_TELEGRAM_BOT_TOKEN
  const CHAT_ID   = import.meta.env.VITE_TELEGRAM_ADMIN_CHAT_ID
  if (!BOT_TOKEN || !CHAT_ID) return
  const time = new Date().toLocaleString("en-GB", {
    day:"2-digit", month:"2-digit", year:"numeric", hour:"2-digit", minute:"2-digit", hour12:true
  })
  const msgs = {
    picked_up: `📦 <b>ပစ္စည်းယူပြီ — သယ်ဆောင်နေသည်</b>
━━━━━━━━━━━━━━━━
📦 <b>Order #${order.id?.slice(-6).toUpperCase()}</b>
⏰ <b>အချိန်:</b> ${time}
🏍️ <b>Rider:</b> ${rider.name}
👤 <b>Customer:</b> ${order.customerName}
📍 <b>From:</b> ${order.pickup?.address}
🎯 <b>To:</b> ${order.dropoff?.address}`,
    delivered: `🎉 <b>ပို့ဆောင်ပြီးပြီ!</b>
━━━━━━━━━━━━━━━━
📦 <b>Order #${order.id?.slice(-6).toUpperCase()}</b>
⏰ <b>အချိန်:</b> ${time}
━━━━━━━━━━━━━━━━
🏍️ <b>Rider:</b> ${rider.name}
👤 <b>Customer:</b> ${order.customerName}
📍 <b>From:</b> ${order.pickup?.address}
🎯 <b>To:</b> ${order.dropoff?.address}
━━━━━━━━━━━━━━━━
💎 <b>ပစ္စည်းတန်ဖိုး:</b> ${Number(order.itemValue||0).toLocaleString()} ကျပ်
🚚 <b>Delivery Fee:</b> ${Number(order.deliveryFee||0).toLocaleString()} ကျပ်
📊 <b>Commission (10%):</b> ${Number(order.commission||0).toLocaleString()} ကျပ်
🏍️ <b>Rider ရရှိသည်:</b> ${Number(order.riderNet||0).toLocaleString()} ကျပ်`
  }
  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method:"POST", headers:{"Content-Type":"application/json"},
    body: JSON.stringify({ chat_id: CHAT_ID, text: msgs[status], parse_mode:"HTML" }),
  }).catch(() => {})
}

// Simulate GPS movement near pickup→dropoff
function simulateRiderPos(pickup, dropoff, step) {
  if (!pickup || !dropoff) return null
  const t = Math.min(step / 20, 1)
  return {
    lat: pickup.lat + (dropoff.lat - pickup.lat) * t + (Math.random() - 0.5) * 0.001,
    lng: pickup.lng + (dropoff.lng - pickup.lng) * t + (Math.random() - 0.5) * 0.001,
  }
}

export default function ActiveDelivery() {
  const { user }  = useAuth()
  const navigate  = useNavigate()
  const [activeOrder, setActiveOrder]   = useState(null)
  const [loading, setLoading]           = useState(true)
  const [updating, setUpdating]         = useState(false)
  const [showDoneModal, setShowDoneModal] = useState(false)
  const [doneData, setDoneData]         = useState(null)
  const [newOrderAlert, setNewOrderAlert] = useState(null)
  const [riderPos, setRiderPos]         = useState(null)
  const moveStep = useRef(0)

  // Active order listener
  useEffect(() => {
    if (!user) return
    const q = query(
      collection(db, "orders"),
      where("riderId", "==", user.uid),
      where("status", "in", ["accepted", "picked_up"])
    )
    const unsub = onSnapshot(q, snap => {
      const orders = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      const order = orders[0] || null
      setActiveOrder(order)
      setLoading(false)
      // init rider position
      if (order?.pickup) {
        setRiderPos({
          lat: order.pickup.lat + (Math.random()-0.5)*0.002,
          lng: order.pickup.lng + (Math.random()-0.5)*0.002,
        })
      }
    })
    return () => unsub()
  }, [user])

  // Simulate GPS movement when picked_up
  useEffect(() => {
    if (!activeOrder || activeOrder.status !== "picked_up") return
    const interval = setInterval(() => {
      moveStep.current += 1
      setRiderPos(simulateRiderPos(activeOrder.pickup, activeOrder.dropoff, moveStep.current))
    }, 2000)
    return () => clearInterval(interval)
  }, [activeOrder?.status])

  // New pending orders alert while delivering
  useEffect(() => {
    if (!activeOrder) return
    const q = query(collection(db, "orders"), where("status", "==", "pending"))
    const unsub = onSnapshot(q, snap => {
      setNewOrderAlert(snap.docs.length > 0 ? snap.docs.length : null)
    })
    return () => unsub()
  }, [activeOrder])

  const statusIdx = activeOrder ? STATUS_FLOW.findIndex(s => s.key === activeOrder.status) : 0

  const handleNext = async () => {
    if (!activeOrder) return
    setUpdating(true)
    try {
      const next = { accepted: "picked_up", picked_up: "delivered" }[activeOrder.status]
      if (!next) return

      await updateDoc(doc(db, "orders", activeOrder.id), {
        status: next,
        updatedAt: serverTimestamp(),
        ...(next === "picked_up"  && { pickedUpAt:  serverTimestamp() }),
        ...(next === "delivered"  && { deliveredAt: serverTimestamp() }),
      })

      await sendTelegramStatus(activeOrder, next, user)

      if (next === "delivered") {
        const result = await deductCommission(user.uid, activeOrder.id, activeOrder.deliveryFee)
        setDoneData({
          itemValue:    activeOrder.itemValue,
          deliveryFee:  activeOrder.deliveryFee,
          commission:   result.commission  ?? activeOrder.commission,
          riderNet:     result.netAmount   ?? activeOrder.riderNet,
          balanceAfter: result.balanceAfter,
        })
        setShowDoneModal(true)
      }
    } catch (e) { alert("Error: " + e.message) }
    finally { setUpdating(false) }
  }

  // Done modal
  if (showDoneModal && doneData) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center flex-col gap-4 px-6">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center text-4xl animate-bounce">🎉</div>
        <h2 className="text-2xl font-display font-black text-dark">ပို့ဆောင်ပြီးပြီ!</h2>
        <div className="w-full max-w-sm bg-white rounded-3xl p-5 shadow-card space-y-2">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">ငွေစာရင်း</p>
          <div className="flex justify-between text-xs">
            <span className="text-gray-400">💎 ပစ္စည်းတန်ဖိုး</span>
            <span className="font-semibold">{Number(doneData.itemValue||0).toLocaleString()} ကျပ်</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-gray-400">🚚 Delivery Fee</span>
            <span className="font-semibold">{Number(doneData.deliveryFee||0).toLocaleString()} ကျပ်</span>
          </div>
          <div className="flex justify-between text-xs border-t pt-2">
            <span className="text-gray-400">💰 Total (Customer ပေးရမည်)</span>
            <span className="font-bold">{(Number(doneData.itemValue||0)+Number(doneData.deliveryFee||0)).toLocaleString()} ကျပ်</span>
          </div>
          <div className="flex justify-between text-xs border-t pt-2">
            <span className="text-gray-400">📊 Commission (10%)</span>
            <span className="text-red-500">- {Number(doneData.commission||0).toLocaleString()} ကျပ်</span>
          </div>
          <div className="flex justify-between text-sm border-t pt-2">
            <span className="font-bold text-gray-700">🏍️ သင်ရရှိသည်</span>
            <span className="text-xl font-display font-black text-green-600">{Number(doneData.riderNet||0).toLocaleString()} ကျပ်</span>
          </div>
          {doneData.balanceAfter !== undefined && (
            <div className="flex justify-between text-xs border-t pt-2">
              <span className="text-gray-400">🪙 Coin လက်ကျန်</span>
              <span className="font-semibold">{Number(doneData.balanceAfter||0).toLocaleString()} ကျပ်</span>
            </div>
          )}
        </div>
        <button onClick={() => navigate("/rider")} className="btn-primary w-full max-w-sm">
          🏠 Dashboard သို့ပြန်မည်
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen bg-surface">
      <Navbar title="Active Delivery" />
      <div className="flex-1 overflow-y-auto pb-28">

        {/* New order alert while delivering */}
        {newOrderAlert && activeOrder && (
          <div className="mx-4 mt-3 bg-orange-500 text-white rounded-2xl p-3 flex items-center gap-3">
            <span className="text-xl animate-bounce">🔔</span>
            <div className="flex-1">
              <p className="text-xs font-bold">Order {newOrderAlert} ခု ထပ်ဝင်နေသည်!</p>
              <p className="text-xs opacity-70">လက်ရှိ delivery ပြီးမှ ကောက်နိုင်မည်</p>
            </div>
            <button onClick={() => setNewOrderAlert(null)} className="text-white/70 text-lg">✕</button>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : !activeOrder ? (
          <div className="flex flex-col items-center justify-center h-64 px-6 text-center">
            <p className="text-4xl mb-3">📭</p>
            <p className="text-gray-400 text-sm">Active delivery မရှိသေးပါ</p>
            <button onClick={() => navigate("/rider")} className="btn-primary mt-4 w-auto px-6">
              Dashboard သို့ပြန်
            </button>
          </div>
        ) : (
          <>
            {/* Map with live rider position */}
            <div className="h-56 relative">
              <MapView
                pickupPoint={activeOrder.pickup}
                dropoffPoint={activeOrder.dropoff}
                riderLocation={riderPos}
                riderName={user?.name}
                height="100%"
              />
              <div className="absolute top-3 left-3 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                GPS Active
              </div>
            </div>

            {/* Status Steps */}
            <div className="px-4 -mt-4 relative z-10">
              <div className={`card ${statusIdx === 2 ? "border-2 border-green-400" : ""}`}>
                <div className="text-center py-2">
                  <span className="text-4xl">{STATUS_FLOW[statusIdx]?.icon}</span>
                  <p className="font-display font-black text-dark text-base mt-2">{STATUS_FLOW[statusIdx]?.label}</p>
                </div>
                <div className="flex items-center justify-center gap-2 my-3">
                  {STATUS_FLOW.map((s, i) => (
                    <div key={s.key} className="flex items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all
                        ${i <= statusIdx ? "bg-primary-500 border-primary-500 text-white" : "bg-white border-gray-200 text-gray-400"}`}>
                        {i < statusIdx ? "✓" : i + 1}
                      </div>
                      {i < STATUS_FLOW.length - 1 && (
                        <div className={`w-10 h-0.5 transition-all ${i < statusIdx ? "bg-primary-500" : "bg-gray-200"}`} />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Order Details */}
            <div className="px-4 mt-3">
              <div className="card space-y-3">
                <div className="flex justify-between items-center">
                  <p className="text-xs text-gray-400">#{activeOrder.id?.slice(-6).toUpperCase()}</p>
                  <p className="font-display font-black text-primary-500">{activeOrder.deliveryFee?.toLocaleString()} ကျပ်</p>
                </div>

                {/* Route */}
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center shrink-0">📦</div>
                  <div>
                    <p className="text-xs text-gray-400">ယူမည့်နေရာ</p>
                    <p className="text-sm font-semibold">{activeOrder.pickup?.address}</p>
                  </div>
                </div>
                <div className="w-px h-3 bg-gray-200 ml-4" />
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center shrink-0">🎯</div>
                  <div>
                    <p className="text-xs text-gray-400">ပို့မည့်နေရာ</p>
                    <p className="text-sm font-semibold">{activeOrder.dropoff?.address}</p>
                  </div>
                </div>

                {/* Customer & Item info */}
                <div className="border-t border-gray-100 pt-3 space-y-1.5">
                  {[
                    ["👤 Customer",    activeOrder.customerName],
                    ["📞 ဖုန်း",         activeOrder.customerPhone, true],
                    ["🏷️ ပစ္စည်း",       activeOrder.itemTypeLabel],
                    ["💳 ငွေ",           activeOrder.paymentType==="cod" ? "💵 COD" : "✅ Cash Pay"],
                    ...(activeOrder.note ? [["📝 မှတ်ချက်", activeOrder.note]] : []),
                  ].map(([k, v, isPhone]) => (
                    <div key={k} className="flex justify-between text-xs">
                      <span className="text-gray-400">{k}</span>
                      {isPhone
                        ? <a href={`tel:${v}`} className="font-semibold text-primary-500">{v}</a>
                        : <span className="font-semibold text-right max-w-[55%]">{v}</span>
                      }
                    </div>
                  ))}
                </div>

                {/* Fee breakdown with item value */}
                <div className="bg-gray-50 rounded-2xl p-3 space-y-1.5 border-t border-gray-100">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">💎 ပစ္စည်းတန်ဖိုး</span>
                    <span className="font-semibold">{Number(activeOrder.itemValue||0).toLocaleString()} ကျပ်</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">🚚 Delivery Fee</span>
                    <span className="font-semibold">{Number(activeOrder.deliveryFee||0).toLocaleString()} ကျပ်</span>
                  </div>
                  <div className="flex justify-between text-xs border-t border-gray-200 pt-1">
                    <span className="font-bold text-gray-600">💰 Total (Customer ပေးရ)</span>
                    <span className="font-bold text-dark">
                      {(Number(activeOrder.itemValue||0)+Number(activeOrder.deliveryFee||0)).toLocaleString()} ကျပ်
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">📊 Commission (10%)</span>
                    <span className="text-red-500">- {Number(activeOrder.commission||0).toLocaleString()} ကျပ်</span>
                  </div>
                  <div className="flex justify-between text-xs border-t border-gray-200 pt-1">
                    <span className="font-bold text-gray-700">🏍️ သင်ရရှိမည်</span>
                    <span className="font-bold text-green-600">{Number(activeOrder.riderNet||0).toLocaleString()} ကျပ်</span>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Bottom Action */}
      {activeOrder && statusIdx < 2 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 py-4 pb-8">
          <button onClick={handleNext} disabled={updating} className="btn-primary disabled:opacity-50">
            {updating ? "အပ်ဒေတ်နေသည်..." : STATUS_FLOW[statusIdx]?.action + " →"}
          </button>
        </div>
      )}
      <BottomNav />
    </div>
  )
}
