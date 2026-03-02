// src/pages/rider/RiderDashboard.jsx
import { useState, useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { collection, query, where, onSnapshot, doc, updateDoc, serverTimestamp, getDoc } from "firebase/firestore"
import { db } from "../../firebase/config"
import { useAuth } from "../../context/AuthContext"
import Navbar from "../../components/common/Navbar"
import BottomNav from "../../components/common/BottomNav"
import MapView from "../../components/map/MapView"

const TODAY_LIMIT    = 3
const TOMORROW_LIMIT = 5

async function sendTelegramAccept(order, rider) {
  const BOT_TOKEN = import.meta.env.VITE_TELEGRAM_BOT_TOKEN
  const CHAT_ID   = import.meta.env.VITE_TELEGRAM_ADMIN_CHAT_ID
  if (!BOT_TOKEN || !CHAT_ID) return
  const now  = new Date()
  const time = now.toLocaleString("en-GB", { day:"2-digit", month:"2-digit", year:"numeric", hour:"2-digit", minute:"2-digit", hour12:true })
  const text = `
✅ <b>Order လက်ခံပြီ!</b>
━━━━━━━━━━━━━━━━
📦 <b>Order #${order.id?.slice(-6).toUpperCase()}</b>
⏰ <b>အချိန်:</b> ${time}
━━━━━━━━━━━━━━━━
🏍️ <b>Rider:</b> ${rider.name}
📞 <b>ဖုန်း:</b> ${rider.phone || "-"}
━━━━━━━━━━━━━━━━
👤 <b>Customer:</b> ${order.customerName}
📍 <b>ယူမည့်နေရာ:</b> ${order.pickup?.address}
🎯 <b>ပို့မည့်နေရာ:</b> ${order.dropoff?.address}
🚚 <b>Delivery Fee:</b> ${order.deliveryFee?.toLocaleString()} ကျပ်
━━━━━━━━━━━━━━━━
🔍 <b>Status:</b> Rider လာနေသည် 🏍️
  `.trim()
  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: CHAT_ID, text, parse_mode: "HTML" }),
  }).catch(() => {})
}

export default function RiderDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [isOnline, setIsOnline]       = useState(false)
  const [pendingOrders, setPendingOrders] = useState([])
  const [todayOrders, setTodayOrders] = useState([])
  const [tomorrowOrders, setTomorrowOrders] = useState([])
  const [riderData, setRiderData]     = useState(null)
  const [accepting, setAccepting]     = useState(null)
  const [newOrderAlert, setNewOrderAlert] = useState(false)
  const prevCountRef = useRef(0)

  // Rider data
  useEffect(() => {
    if (!user) return
    const unsub = onSnapshot(doc(db, "riders", user.uid), snap => {
      if (snap.exists()) setRiderData(snap.data())
    })
    return () => unsub()
  }, [user])

  // Online status sync
  useEffect(() => {
    if (!user) return
    updateDoc(doc(db, "riders", user.uid), {
      isOnline, updatedAt: serverTimestamp()
    }).catch(() => {})
  }, [isOnline, user])

  // Today delivered orders count
  useEffect(() => {
    if (!user) return
    const todayStart = new Date(); todayStart.setHours(0,0,0,0)
    const q = query(
      collection(db, "orders"),
      where("riderId", "==", user.uid),
      where("status", "==", "delivered")
    )
    const unsub = onSnapshot(q, snap => {
      const all = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      const today = all.filter(o => {
        const d = o.createdAt?.toDate?.() || new Date(0)
        return d >= todayStart
      })
      const tomorrow = all.filter(o => {
        const d = o.createdAt?.toDate?.() || new Date(0)
        return d < todayStart
      })
      setTodayOrders(today)
      setTomorrowOrders(tomorrow)
    })
    return () => unsub()
  }, [user])

  // Pending orders listener
  useEffect(() => {
    if (!user || !isOnline) { setPendingOrders([]); return }
    const q = query(
      collection(db, "orders"),
      where("status", "==", "pending")
    )
    const unsub = onSnapshot(q, snap => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      data.sort((a,b) => (a.createdAt?.seconds||0) - (b.createdAt?.seconds||0))
      // New order alert
      if (data.length > prevCountRef.current) setNewOrderAlert(true)
      prevCountRef.current = data.length
      setPendingOrders(data)
    })
    return () => unsub()
  }, [user, isOnline])

  const canTakeOrder = () => {
    // Today limit check
    const accepted = todayOrders.length
    if (accepted >= TODAY_LIMIT) return { ok: false, reason: `ယနေ့ ${TODAY_LIMIT} ကြိမ် ပြည့်ပြီ` }
    return { ok: true }
  }

  const handleAccept = async (order) => {
    const check = canTakeOrder()
    if (!check.ok) { alert(check.reason); return }
    setAccepting(order.id)
    try {
      await updateDoc(doc(db, "orders", order.id), {
        status:      "accepted",
        riderId:     user.uid,
        riderName:   user.name,
        riderPhone:  user.phone || "",
        acceptedAt:  serverTimestamp(),
        updatedAt:   serverTimestamp(),
      })
      await sendTelegramAccept(order, user)
      navigate("/rider/delivery")
    } catch { alert("Error ဖြစ်သည်") }
    finally { setAccepting(null) }
  }

  const todayEarned  = todayOrders.reduce((s, o) => s + (o.riderNet || o.deliveryFee || 0), 0)
  const tomorrowBooked = tomorrowOrders.slice(0, TOMORROW_LIMIT).length

  return (
    <div className="flex flex-col h-screen bg-surface">
      <Navbar />
      <div className="flex-1 overflow-y-auto pb-24">

        {/* New Order Alert */}
        {newOrderAlert && isOnline && (
          <div className="mx-4 mt-3 bg-primary-500 text-white rounded-2xl p-3 flex items-center gap-3 animate-slide-up">
            <span className="text-2xl animate-bounce">🔔</span>
            <div className="flex-1">
              <p className="text-xs font-bold">Order သစ် ဝင်လာပြီ!</p>
            </div>
            <button onClick={() => setNewOrderAlert(false)} className="text-white/70 text-xs">✕</button>
          </div>
        )}

        {/* Status Header */}
        <div className={`px-4 py-4 ${isOnline ? "bg-dark" : "bg-gray-600"} transition-colors`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-xs">မင်္ဂလာပါ 🏍️</p>
              <h2 className="text-lg font-display font-black text-white">{user?.name}</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-yellow-400 text-xs">⭐ {riderData?.rating || "4.8"}</span>
                <span className="text-gray-500 text-xs">·</span>
                <span className="text-gray-400 text-xs">{riderData?.totalDeliveries || 0} deliveries</span>
              </div>
            </div>
            <div className="flex flex-col items-center gap-1">
              <button onClick={() => setIsOnline(!isOnline)}
                className={`relative w-14 h-8 rounded-full transition-colors ${isOnline ? "bg-green-500" : "bg-gray-500"}`}>
                <div className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow transition-transform ${isOnline ? "translate-x-7" : "translate-x-1"}`} />
              </button>
              <span className={`text-[10px] font-bold ${isOnline ? "text-green-400" : "text-gray-400"}`}>
                {isOnline ? "ONLINE" : "OFFLINE"}
              </span>
            </div>
          </div>
        </div>

        {/* Map */}
        <div className="px-4 mt-4 mb-4">
          <div className="h-40 rounded-3xl overflow-hidden shadow-card">
            <MapView height="100%" />
          </div>
        </div>

        {/* Today Stats */}
        <div className="px-4 mb-4">
          <div className="grid grid-cols-3 gap-2">
            <div className="card text-center">
              <p className="text-xl mb-1">📦</p>
              <p className="font-display font-black text-dark text-base">
                {todayOrders.length}<span className="text-gray-400 text-xs">/{TODAY_LIMIT}</span>
              </p>
              <p className="text-[10px] text-gray-400">ယနေ့ Orders</p>
            </div>
            <div className="card text-center">
              <p className="text-xl mb-1">💰</p>
              <p className="font-display font-black text-dark text-sm">{todayEarned.toLocaleString()}</p>
              <p className="text-[10px] text-gray-400">ကျပ် (ယနေ့)</p>
            </div>
            <div className="card text-center">
              <p className="text-xl mb-1">🪙</p>
              <p className="font-display font-black text-dark text-base">{riderData?.coinBalance?.toLocaleString() || "0"}</p>
              <p className="text-[10px] text-gray-400">Coin လက်ကျန်</p>
            </div>
          </div>
        </div>

        {/* Tomorrow pre-book info */}
        <div className="px-4 mb-4">
          <div className="card flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-2xl flex items-center justify-center text-xl">📅</div>
            <div className="flex-1">
              <p className="text-xs font-bold text-dark">မနက်ဖြန် Orders ကြိုကောက်လို့ရသည်</p>
              <p className="text-xs text-gray-400">{TOMORROW_LIMIT} ကြိမ် အထိ ကောက်နိုင်သည်</p>
            </div>
            <span className="text-xs font-bold text-blue-500">{tomorrowBooked}/{TOMORROW_LIMIT}</span>
          </div>
        </div>

        {/* Coin low warning */}
        {riderData?.coinBalance < 1000 && (
          <div className="mx-4 mb-4 bg-red-50 border border-red-200 rounded-2xl p-3 flex items-center gap-2">
            <span className="text-xl">⚠️</span>
            <div>
              <p className="text-xs font-bold text-red-600">Coin နည်းနေပြီ!</p>
              <p className="text-xs text-red-400">Admin ကို coin ဖြည့်ပေးဖို့ ပြောပါ</p>
            </div>
          </div>
        )}

        {/* Available Orders */}
        {isOnline ? (
          <div className="px-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Available Orders</p>
              {pendingOrders.length > 0 && (
                <span className="bg-primary-100 text-primary-600 text-xs font-bold px-2 py-0.5 rounded-full">
                  {pendingOrders.length} new
                </span>
              )}
            </div>

            {todayOrders.length >= TODAY_LIMIT ? (
              <div className="card text-center py-6">
                <p className="text-3xl mb-2">🎉</p>
                <p className="text-sm font-bold text-dark">ယနေ့ Order ပြည့်ပြီ!</p>
                <p className="text-xs text-gray-400 mt-1">မနက်ဖြန် ဆက်လုပ်နိုင်သည်</p>
              </div>
            ) : pendingOrders.length === 0 ? (
              <div className="card text-center py-8">
                <p className="text-3xl mb-2">📭</p>
                <p className="text-gray-400 text-sm">Order မရှိသေးပါ</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingOrders.map(order => (
                  <div key={order.id} className="card">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="text-xs text-gray-400">#{order.id?.slice(-6).toUpperCase()}</p>
                        <p className="font-display font-black text-dark">{order.deliveryFee?.toLocaleString()} ကျပ်</p>
                        <p className="text-xs text-gray-400">Rider ရမည်: {order.riderNet?.toLocaleString()} ကျပ်</p>
                      </div>
                      <div className="text-right">
                        <span className="text-xs text-gray-400">{order.distKm} km</span>
                        <p className="text-xs mt-1">{order.paymentType === "cod" ? "💵 COD" : "✅ Cash"}</p>
                      </div>
                    </div>
                    <div className="space-y-1.5 mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500" />
                        <p className="text-xs text-gray-600">{order.pickup?.address}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-red-500" />
                        <p className="text-xs text-gray-600">{order.dropoff?.address}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mb-3 bg-gray-50 rounded-xl p-2">
                      <span className="text-xs text-gray-400">👤 {order.customerName}</span>
                      <span className="text-gray-300">·</span>
                      <span className="text-xs text-gray-400">🏷️ {order.itemTypeLabel}</span>
                    </div>
                    <div className="flex gap-2">
                      <button className="flex-1 py-2.5 rounded-xl bg-gray-100 text-gray-600 text-xs font-bold">
                        ❌ ငြင်းမည်
                      </button>
                      <button onClick={() => handleAccept(order)}
                        disabled={accepting === order.id}
                        className="flex-[2] py-2.5 rounded-xl bg-primary-500 text-white text-xs font-bold shadow-primary disabled:opacity-50">
                        {accepting === order.id ? "လက်ခံနေသည်..." : "✅ လက်ခံမည်"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="px-4 py-8 text-center">
            <p className="text-5xl mb-3">😴</p>
            <p className="text-gray-400 text-sm">Offline - Orders မမြင်ရပါ</p>
            <button onClick={() => setIsOnline(true)} className="mt-4 btn-primary w-auto px-8">
              Online ဖွင့်မည်
            </button>
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  )
}
