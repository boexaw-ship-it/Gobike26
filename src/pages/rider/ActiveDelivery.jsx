// src/pages/rider/ActiveDelivery.jsx
import { useState, useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom"
import {
  collection, query, where, onSnapshot,
  doc, updateDoc, serverTimestamp
} from "firebase/firestore"
import { db } from "../../firebase/config"
import { useAuth } from "../../context/AuthContext"
import { deductCommission } from "../../services/walletService"
import { notifyPickedUp, notifyDelivered } from "../../services/notificationService" 
import Navbar from "../../components/common/Navbar"
import BottomNav from "../../components/common/BottomNav"
import MapView from "../../components/map/MapView"

// ─── Status flow ─────────────────────────────
// DB status:  accepted  →  picked_up  →  delivered
// Button:    "ပစ္စည်းယူပြီ"  →  "ပို့ဆောင်ပြီ"
const STATUS_FLOW = [
  { key: "accepted",  icon: "✅", label: "Order လက်ခံပြီ",           btnLabel: "📦 ပစ္စည်းယူပြီ →" },
  { key: "picked_up", icon: "📦", label: "ပစ္စည်းယူပြီ — သယ်ဆောင်နေသည်", btnLabel: "🎉 ပို့ဆောင်ပြီ →" },
  { key: "delivered", icon: "🎉", label: "ပို့ဆောင်ပြီးပြီ!",          btnLabel: null },
]

async function sendTelegramStatus(order, newStatus, riderName) {
  const BOT   = import.meta.env.VITE_TELEGRAM_BOT_TOKEN
  const CHAT  = import.meta.env.VITE_TELEGRAM_ADMIN_CHAT_ID
  if (!BOT || !CHAT) return
  const time  = new Date().toLocaleString("en-GB", {
    day:"2-digit", month:"2-digit", year:"numeric",
    hour:"2-digit", minute:"2-digit", hour12:true,
  })
  const id    = order.id?.slice(-6).toUpperCase()
  const total = Number(order.itemValue||0) + Number(order.deliveryFee||0)

  const text = newStatus === "picked_up"
    ? `📦 <b>ပစ္စည်းယူပြီ — သယ်ဆောင်နေသည်</b>\n━━━━━━━━━━━━━━━━\n📦 <b>Order #${id}</b>\n⏰ ${time}\n🏍️ <b>Rider:</b> ${riderName}\n👤 <b>Customer:</b> ${order.customerName}\n📍 ${order.pickup?.address}\n🎯 ${order.dropoff?.address}`
    : `🎉 <b>ပို့ဆောင်ပြီးပြီ!</b>\n━━━━━━━━━━━━━━━━\n📦 <b>Order #${id}</b>\n⏰ ${time}\n🏍️ <b>Rider:</b> ${riderName}\n👤 <b>Customer:</b> ${order.customerName}\n━━━━━━━━━━━━━━━━\n💎 <b>ပစ္စည်းတန်ဖိုး:</b> ${Number(order.itemValue||0).toLocaleString()} ကျပ်\n🚚 <b>Delivery Fee:</b> ${Number(order.deliveryFee||0).toLocaleString()} ကျပ်\n💰 <b>Total:</b> ${total.toLocaleString()} ကျပ်\n📊 <b>Commission (10%):</b> ${Number(order.commission||0).toLocaleString()} ကျပ်\n🏍️ <b>Rider ရရှိသည်:</b> ${Number(order.riderNet||0).toLocaleString()} ကျပ်`

  await fetch(`https://api.telegram.org/bot${BOT}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: CHAT, text, parse_mode: "HTML" }),
  }).catch(() => {})
}

// GPS simulate: rider မြင်သွားသည့်လမ်း
function simulateMove(pickup, dropoff, step) {
  if (!pickup) return null
  const dest = dropoff || pickup
  const t = Math.min(step / 30, 1)
  return {
    lat: pickup.lat + (dest.lat - pickup.lat) * t + (Math.random() - 0.5) * 0.0008,
    lng: pickup.lng + (dest.lng - pickup.lng) * t + (Math.random() - 0.5) * 0.0008,
  }
}

// ─── Done Modal ───────────────────────────────
function DoneModal({ data, onHome }) {
  const total = Number(data.itemValue||0) + Number(data.deliveryFee||0)
  return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center px-6 gap-4">
      <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center text-4xl animate-bounce">🎉</div>
      <h2 className="text-2xl font-display font-black text-dark">ပို့ဆောင်ပြီးပြီ!</h2>

      <div className="w-full max-w-sm bg-white rounded-3xl p-5 shadow-card space-y-2">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">ငွေစာရင်း</p>
        <div className="flex justify-between text-xs">
          <span className="text-gray-400">💎 ပစ္စည်းတန်ဖိုး</span>
          <span className="font-semibold">{Number(data.itemValue||0).toLocaleString()} ကျပ်</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-gray-400">🚚 Delivery Fee</span>
          <span className="font-semibold">{Number(data.deliveryFee||0).toLocaleString()} ကျပ်</span>
        </div>
        <div className="flex justify-between text-xs border-t pt-2">
          <span className="font-bold text-gray-700">💰 Total (Customer ပေးရ)</span>
          <span className="font-bold">{total.toLocaleString()} ကျပ်</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-gray-400">📊 Commission (10%)</span>
          <span className="text-red-500 font-semibold">- {Number(data.commission||0).toLocaleString()} ကျပ်</span>
        </div>
        <div className="flex justify-between text-sm border-t pt-2">
          <span className="font-bold text-gray-700">🏍️ သင်ရရှိသည်</span>
          <span className="text-xl font-display font-black text-green-600">
            {Number(data.riderNet||0).toLocaleString()} ကျပ်
          </span>
        </div>
        {data.coinBalance !== undefined && (
          <div className="flex justify-between text-xs border-t pt-2">
            <span className="text-gray-400">🪙 Coin လက်ကျန်</span>
            <span className="font-semibold">{Number(data.coinBalance||0).toLocaleString()} ကျပ်</span>
          </div>
        )}
      </div>

      <button onClick={onHome} className="btn-primary w-full max-w-sm">
        🏠 Dashboard သို့ပြန်မည်
      </button>
    </div>
  )
}

// ─── Main Component ───────────────────────────
export default function ActiveDelivery() {
  const { user }    = useAuth()
  const navigate    = useNavigate()

  const [order, setOrder]             = useState(null)
  const [loading, setLoading]         = useState(true)
  const [btnLoading, setBtnLoading]   = useState(false)
  const [doneData, setDoneData]       = useState(null)
  const [newAlert, setNewAlert]       = useState(0)
  const [riderPos, setRiderPos]       = useState(null)
  const stepRef  = useRef(0)

  // ── Firebase: watch my active order ──────────
  useEffect(() => {
    if (!user) return
    const q = query(
      collection(db, "orders"),
      where("riderId", "==", user.uid),
      where("status", "in", ["accepted", "picked_up"])
    )
    const unsub = onSnapshot(q, snap => {
      const rows = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      const cur  = rows[0] || null
      setOrder(cur)
      setLoading(false)
      if (cur?.pickup && !riderPos) {
        setRiderPos({
          lat: cur.pickup.lat + (Math.random()-0.5)*0.003,
          lng: cur.pickup.lng + (Math.random()-0.5)*0.003,
        })
      }
    }, err => {
      console.error("ActiveDelivery listener:", err)
      setLoading(false)
    })
    return () => unsub()
  }, [user])

  // ── GPS simulation ────────────────────────────
  useEffect(() => {
    if (!order) return
    const interval = setInterval(() => {
      stepRef.current += 1
      setRiderPos(simulateMove(order.pickup, order.dropoff, stepRef.current))
    }, 2500)
    return () => clearInterval(interval)
  }, [order?.id, order?.status])

  // ── New orders alert while delivering ─────────
  useEffect(() => {
    if (!order) return
    const q    = query(collection(db, "orders"), where("status", "==", "pending"))
    const unsub = onSnapshot(q, snap => setNewAlert(snap.docs.length))
    return () => unsub()
  }, [order?.id])

  // ── Status index from DB ──────────────────────
  const statusIdx = order
    ? STATUS_FLOW.findIndex(s => s.key === order.status)
    : -1

  // ── Next button handler ───────────────────────
  const handleNext = async () => {
    if (!order || btnLoading) return
    const transitions = { accepted: "picked_up", picked_up: "delivered" }
    const nextStatus  = transitions[order.status]
    if (!nextStatus) return

    setBtnLoading(true)
    try {
      const updatePayload = {
        status:    nextStatus,
        updatedAt: serverTimestamp(),
        ...(nextStatus === "picked_up"  && { pickedUpAt:  serverTimestamp() }),
        ...(nextStatus === "delivered"  && { deliveredAt: serverTimestamp() }),
      }
      await updateDoc(doc(db, "orders", order.id), updatePayload)
      await sendTelegramStatus(order, nextStatus, user?.name)

      // Firebase notifications
      if (nextStatus === "picked_up") {
        await notifyPickedUp(order)
      }

      if (nextStatus === "delivered") {
        const result = await deductCommission(user.uid, order.id, order.deliveryFee)
        setDoneData({
          itemValue:   order.itemValue,
          deliveryFee: order.deliveryFee,
          commission:  result.commission  ?? order.commission,
          riderNet:    result.netAmount   ?? order.riderNet,
          coinBalance: result.balanceAfter,
        })
      }
    } catch (e) {
      alert("Error ဖြစ်သည်: " + e.message)
    } finally {
      setBtnLoading(false)
    }
  }

  // ── Done screen ───────────────────────────────
  if (doneData) {
    return <DoneModal data={doneData} onHome={() => navigate("/rider")} />
  }

  return (
    <div className="flex flex-col h-screen bg-surface">
      <Navbar title="Active Delivery" />

      <div className="flex-1 overflow-y-auto pb-36">

        {/* New order alert */}
        {newAlert > 0 && order && (
          <div className="mx-4 mt-3 bg-orange-500 text-white rounded-2xl p-3 flex items-center gap-3">
            <span className="text-xl animate-bounce">🔔</span>
            <div className="flex-1">
              <p className="text-xs font-bold">Order {newAlert} ခု ထပ်ဝင်နေသည်!</p>
              <p className="text-[10px] opacity-70">လက်ရှိ delivery ပြီးမှ ကောက်နိုင်မည်</p>
            </div>
            <button onClick={() => setNewAlert(0)} className="text-white/70 text-lg leading-none">✕</button>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* No active order */}
        {!loading && !order && (
          <div className="flex flex-col items-center justify-center h-64 px-6 text-center">
            <p className="text-4xl mb-3">📭</p>
            <p className="text-gray-400 text-sm">Active delivery မရှိသေးပါ</p>
            <button onClick={() => navigate("/rider")} className="btn-primary mt-4 w-auto px-6">
              Dashboard သို့ပြန်
            </button>
          </div>
        )}

        {/* Active Order UI */}
        {!loading && order && (
          <>
            {/* Map */}
            <div className="h-52 relative">
              <MapView
                pickupPoint={order.pickup}
                dropoffPoint={order.dropoff}
                riderLocation={riderPos}
                riderName={user?.name}
                height="100%"
              />
              <div className="absolute top-3 left-3 bg-green-500 text-white text-[11px] font-bold px-2 py-1 rounded-full flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                GPS Active
              </div>
            </div>

            {/* Status steps */}
            <div className="px-4 -mt-3 relative z-10">
              <div className="card">
                <div className="text-center py-2">
                  <span className="text-4xl">{STATUS_FLOW[statusIdx]?.icon ?? "⏳"}</span>
                  <p className="font-display font-black text-dark text-base mt-1">
                    {STATUS_FLOW[statusIdx]?.label ?? "Loading..."}
                  </p>
                </div>
                {/* step dots */}
                <div className="flex items-center justify-center gap-2 mt-3 mb-1">
                  {STATUS_FLOW.map((s, i) => (
                    <div key={s.key} className="flex items-center">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm border-2 font-bold transition-all
                        ${i <= statusIdx
                          ? "bg-primary-500 border-primary-500 text-white"
                          : "bg-white border-gray-200 text-gray-400"}`}>
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

            {/* Order card */}
            <div className="px-4 mt-3 pb-2">
              <div className="card space-y-3">
                {/* header */}
                <div className="flex justify-between items-center">
                  <p className="text-xs text-gray-400 font-bold">#{order.id?.slice(-6).toUpperCase()}</p>
                  <p className="font-display font-black text-primary-500 text-lg">
                    {Number(order.deliveryFee||0).toLocaleString()} ကျပ်
                  </p>
                </div>

                {/* route */}
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center shrink-0 mt-0.5">📦</div>
                  <div>
                    <p className="text-[10px] text-gray-400">ယူမည့်နေရာ</p>
                    <p className="text-sm font-semibold">{order.pickup?.address}</p>
                  </div>
                </div>
                <div className="w-px h-3 bg-gray-200 ml-4" />
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center shrink-0 mt-0.5">🎯</div>
                  <div>
                    <p className="text-[10px] text-gray-400">ပို့မည့်နေရာ</p>
                    <p className="text-sm font-semibold">{order.dropoff?.address}</p>
                  </div>
                </div>

                {/* info rows */}
                <div className="border-t border-gray-100 pt-2 space-y-1.5">
                  {[
                    ["👤 Customer",  order.customerName,  false],
                    ["📞 ဖုန်း",      order.customerPhone, true],
                    ["🏷️ ပစ္စည်း",    order.itemTypeLabel, false],
                    ["💳 ငွေ", order.paymentType === "cod" ? "💵 COD" : "✅ Cash Pay", false],
                    ...(order.note ? [["📝 မှတ်ချက်", order.note, false]] : []),
                  ].map(([k, v, phone]) => (
                    <div key={k} className="flex justify-between items-center text-xs">
                      <span className="text-gray-400">{k}</span>
                      {phone
                        ? <a href={`tel:${v}`} className="font-semibold text-primary-500">{v}</a>
                        : <span className="font-semibold text-right max-w-[58%]">{v}</span>
                      }
                    </div>
                  ))}
                </div>

                {/* fee breakdown */}
                <div className="bg-gray-50 rounded-2xl p-3 space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">💎 ပစ္စည်းတန်ဖိုး</span>
                    <span className="font-semibold">{Number(order.itemValue||0).toLocaleString()} ကျပ်</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">🚚 Delivery Fee</span>
                    <span className="font-semibold">{Number(order.deliveryFee||0).toLocaleString()} ကျပ်</span>
                  </div>
                  <div className="flex justify-between text-xs border-t border-gray-200 pt-1.5">
                    <span className="font-bold text-gray-700">💰 Total (Customer ပေးရ)</span>
                    <span className="font-bold">
                      {(Number(order.itemValue||0)+Number(order.deliveryFee||0)).toLocaleString()} ကျပ်
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">📊 Commission (10%)</span>
                    <span className="text-red-500 font-semibold">- {Number(order.commission||0).toLocaleString()} ကျပ်</span>
                  </div>
                  <div className="flex justify-between text-xs border-t border-gray-200 pt-1.5">
                    <span className="font-bold text-gray-700">🏍️ သင်ရရှိမည်</span>
                    <span className="font-bold text-green-600 text-sm">{Number(order.riderNet||0).toLocaleString()} ကျပ်</span>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── Action Button ─────────────────────── */}
      {order && statusIdx >= 0 && statusIdx < 2 && (
        <div className="fixed bottom-16 left-0 right-0 bg-white border-t border-gray-100 px-4 pt-3 pb-3">
          <button
            onClick={handleNext}
            disabled={btnLoading}
            className="w-full bg-primary-500 text-white font-display font-bold py-4 rounded-2xl shadow-primary active:scale-95 transition-all text-base disabled:opacity-50"
          >
            {btnLoading
              ? "အပ်ဒေတ်နေသည်..."
              : STATUS_FLOW[statusIdx]?.btnLabel}
          </button>
        </div>
      )}

      <BottomNav />
    </div>
  )
}
