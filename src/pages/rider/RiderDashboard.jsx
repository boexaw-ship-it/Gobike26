// src/pages/rider/RiderDashboard.jsx
import { useState, useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom"
import {
  collection, query, where, onSnapshot,
  doc, updateDoc, setDoc, getDoc, serverTimestamp
} from "firebase/firestore"
import { db } from "../../firebase/config"
import { useAuth } from "../../context/AuthContext"
import { notifyOrderAccepted } from "../../services/notificationService"
import Navbar from "../../components/common/Navbar"
import BottomNav from "../../components/common/BottomNav"
import Toast from "../../components/common/Toast"

const TODAY_LIMIT    = 5
const TOMORROW_LIMIT = 5

async function sendTelegramAccept(order, rider) {
  const BOT   = import.meta.env.VITE_TELEGRAM_BOT_TOKEN
  const CHAT  = import.meta.env.VITE_TELEGRAM_ADMIN_CHAT_ID
  if (!BOT || !CHAT) return
  const time = new Date().toLocaleString("en-GB", {
    day:"2-digit", month:"2-digit", year:"numeric",
    hour:"2-digit", minute:"2-digit", hour12:true,
  })
  const text = `✅ <b>Order လက်ခံပြီ!</b>
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
🚚 <b>Delivery Fee:</b> ${Number(order.deliveryFee||0).toLocaleString()} ကျပ်
🏍️ <b>Rider ရမည်:</b> ${Number(order.riderNet||0).toLocaleString()} ကျပ်
━━━━━━━━━━━━━━━━
🔍 <b>Status:</b> Rider လာနေသည် 🏍️`
  await fetch(`https://api.telegram.org/bot${BOT}/sendMessage`, {
    method:"POST", headers:{"Content-Type":"application/json"},
    body: JSON.stringify({ chat_id: CHAT, text, parse_mode:"HTML" }),
  }).catch(() => {})
}

function getTodayCount(orders) {
  const start = new Date(); start.setHours(0,0,0,0)
  return orders.filter(o => {
    const d = o.acceptedAt?.toDate?.() || o.createdAt?.toDate?.() || new Date(0)
    return d >= start && ["accepted","picked_up","delivered"].includes(o.status)
  }).length
}

export default function RiderDashboard() {
  const { user }  = useAuth()
  const navigate  = useNavigate()
  const [isOnline, setIsOnline]           = useState(false)
  const [onlineLoaded, setOnlineLoaded]   = useState(false) // Firebase ကနေ load ပြီးမှ render
  const [pendingOrders, setPendingOrders] = useState([])
  const [myOrders, setMyOrders]           = useState([])
  const [riderData, setRiderData]         = useState(null)
  const [accepting, setAccepting]         = useState(null)
  const [newOrderAlert, setNewOrderAlert] = useState(false)
  const [tab, setTab]                     = useState("today")
  const [toast, setToast]                 = useState(null)
  const prevCountRef = useRef(0)
  const onlineRef    = useRef(false) // prevent double-write on mount

  const showToast = (msg, type = "success") => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  // ── Ensure riders doc + load isOnline from Firebase ──
  useEffect(() => {
    if (!user) return
    const riderRef = doc(db, "riders", user.uid)
    getDoc(riderRef).then(snap => {
      if (!snap.exists()) {
        setDoc(riderRef, {
          name: user.name, phone: user.phone || "",
          isOnline: false, coinBalance: 0,
          totalEarned: 0, totalCommission: 0,
          rating: 5.0, totalDeliveries: 0,
          createdAt: serverTimestamp(),
        })
        setIsOnline(false)
      } else {
        // Firebase ထဲက isOnline ကို ယူ
        const savedOnline = snap.data()?.isOnline ?? false
        setIsOnline(savedOnline)
        onlineRef.current = savedOnline
      }
      setOnlineLoaded(true)
    })
  }, [user])

  // ── Rider data real-time ──
  useEffect(() => {
    if (!user) return
    const unsub = onSnapshot(doc(db, "riders", user.uid), snap => {
      if (snap.exists()) setRiderData(snap.data())
    })
    return () => unsub()
  }, [user])

  // ── Sync online to Firebase (only after loaded, only on real change) ──
  useEffect(() => {
    if (!user || !onlineLoaded) return
    if (onlineRef.current === isOnline) return // no change, skip
    onlineRef.current = isOnline
    updateDoc(doc(db, "riders", user.uid), {
      isOnline, updatedAt: serverTimestamp()
    }).catch(() => {})
  }, [isOnline, onlineLoaded, user])

  // ── My orders ──
  useEffect(() => {
    if (!user) return
    const q = query(collection(db, "orders"), where("riderId", "==", user.uid))
    const unsub = onSnapshot(q, snap => {
      setMyOrders(snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(o => !o.hiddenByRider))  // history ထဲ ဖျောက်ထားသောများ dashboard မှာလည်း မပြ
    })
    return () => unsub()
  }, [user])

  // ── Pending orders ──
  useEffect(() => {
    if (!user || !isOnline) { setPendingOrders([]); return }
    const q = query(collection(db, "orders"), where("status", "==", "pending"))
    const unsub = onSnapshot(q, snap => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      data.sort((a,b) => (a.createdAt?.seconds||0) - (b.createdAt?.seconds||0))
      if (data.length > prevCountRef.current && prevCountRef.current >= 0) {
        setNewOrderAlert(true)
      }
      prevCountRef.current = data.length
      setPendingOrders(data)
    })
    return () => unsub()
  }, [user, isOnline])

  const todayStart   = new Date(); todayStart.setHours(0,0,0,0)
  const tomStart     = new Date(); tomStart.setDate(tomStart.getDate()+1); tomStart.setHours(0,0,0,0)
  const tomEnd       = new Date(tomStart); tomEnd.setHours(23,59,59,999)

  const todayOrders  = myOrders.filter(o => {
    const d = o.acceptedAt?.toDate?.() || o.createdAt?.toDate?.() || new Date(0)
    return d >= todayStart
  }).sort((a,b) => (b.createdAt?.seconds||0) - (a.createdAt?.seconds||0))

  const tomorrowOrders = myOrders.filter(o => {
    const d = o.createdAt?.toDate?.() || new Date(0)
    return d >= tomStart && d <= tomEnd
  })

  const todayCount   = getTodayCount(myOrders)
  const canToday     = todayCount < TODAY_LIMIT
  const canTomorrow  = tomorrowOrders.length < TOMORROW_LIMIT
  const todayEarned  = todayOrders.filter(o=>o.status==="delivered").reduce((s,o)=>s+(o.riderNet||0),0)

  const handleAccept = async (order) => {
    if (tab === "today" && !canToday) {
      showToast(`ယနေ့ ${TODAY_LIMIT} ကြိမ် ပြည့်နေပြီ 😊`, "warn")
      return
    }
    if (tab === "tomorrow" && !canTomorrow) {
      showToast(`မနက်ဖြန် ${TOMORROW_LIMIT} ကြိမ် ပြည့်နေပြီ`, "warn")
      return
    }
    setAccepting(order.id)
    try {
      await updateDoc(doc(db, "orders", order.id), {
        status: "accepted", riderId: user.uid,
        riderName: user.name, riderPhone: user.phone || "",
        acceptedAt: serverTimestamp(), updatedAt: serverTimestamp(),
        scheduledFor: tab,
      })
      await sendTelegramAccept(order, user)
      await notifyOrderAccepted({ ...order, riderName: user.name })
      showToast("Order လက်ခံပြီ! ✅", "success")
      navigate("/rider/delivery")
    } catch (e) {
      showToast("Error ဖြစ်သည်: " + e.message, "error")
    } finally {
      setAccepting(null) }
  }

  const handleToggleOnline = () => {
    const next = !isOnline
    setIsOnline(next)
    showToast(next ? "🟢 Online ဖြစ်ပြီ!" : "⚫ Offline ဖြစ်ပြီ", next ? "success" : "warn")
  }

  const statusLabel = {
    pending:"⏳ Pending", accepted:"🏍️ လာနေ",
    picked_up:"📦 သယ်", delivered:"✅ ပို့ပြီး", cancelled:"❌ ပယ်",
  }

  if (!onlineLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen bg-surface">
      <Navbar />
      {toast && <Toast message={toast.msg} type={toast.type} />}
      <div className="flex-1 overflow-y-auto pb-24">

        {newOrderAlert && isOnline && (
          <div className="mx-4 mt-3 bg-primary-500 text-white rounded-2xl p-3 flex items-center gap-3">
            <span className="text-2xl animate-bounce">🔔</span>
            <p className="flex-1 text-xs font-bold">Order သစ် ဝင်လာပြီ!</p>
            <button onClick={() => setNewOrderAlert(false)} className="text-white/70">✕</button>
          </div>
        )}

        {/* Header */}
        <div className={`px-4 py-4 ${isOnline ? "bg-dark" : "bg-gray-600"} transition-colors`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-xs">မင်္ဂလာပါ 🏍️</p>
              <h2 className="text-lg font-display font-black text-white">{user?.name}</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-yellow-400 text-xs">⭐ {riderData?.rating || "5.0"}</span>
                <span className="text-gray-500 text-xs">·</span>
                <span className="text-gray-400 text-xs">{riderData?.totalDeliveries || 0} deliveries</span>
                <span className="text-gray-500 text-xs">·</span>
                <span className="text-yellow-300 text-xs">🪙 {riderData?.coinBalance?.toLocaleString() || 0}</span>
              </div>
            </div>
            <div className="flex flex-col items-center gap-1">
              <button onClick={handleToggleOnline}
                className={`relative w-14 h-8 rounded-full transition-colors ${isOnline ? "bg-green-500" : "bg-gray-500"}`}>
                <div className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow transition-transform ${isOnline ? "translate-x-7" : "translate-x-1"}`} />
              </button>
              <span className={`text-[10px] font-bold ${isOnline ? "text-green-400" : "text-gray-400"}`}>
                {isOnline ? "ONLINE" : "OFFLINE"}
              </span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="px-4 mt-4 mb-4">
          <div className="grid grid-cols-3 gap-2">
            <div className="card text-center">
              <p className="text-xl mb-1">📦</p>
              <p className="font-display font-black text-dark">{todayCount}<span className="text-gray-400 text-xs">/{TODAY_LIMIT}</span></p>
              <p className="text-[10px] text-gray-400">ယနေ့</p>
            </div>
            <div className="card text-center">
              <p className="text-xl mb-1">💰</p>
              <p className="font-display font-black text-dark text-sm">{todayEarned.toLocaleString()}</p>
              <p className="text-[10px] text-gray-400">ကျပ်</p>
            </div>
            <div className="card text-center">
              <p className="text-xl mb-1">📅</p>
              <p className="font-display font-black text-dark">{tomorrowOrders.length}<span className="text-gray-400 text-xs">/{TOMORROW_LIMIT}</span></p>
              <p className="text-[10px] text-gray-400">မနက်ဖြန်</p>
            </div>
          </div>
        </div>

        {riderData?.coinBalance < 1000 && (
          <div className="mx-4 mb-3 bg-red-50 border border-red-200 rounded-2xl p-3 flex items-center gap-2">
            <span className="text-xl">⚠️</span>
            <div>
              <p className="text-xs font-bold text-red-600">Coin နည်းနေပြီ!</p>
              <p className="text-xs text-red-400">Admin ကို coin ဖြည့်ပေးဖို့ ပြောပါ</p>
            </div>
          </div>
        )}

        {isOnline ? (
          <div className="px-4">
            {/* Tab */}
            <div className="flex bg-gray-100 rounded-2xl p-1 gap-1 mb-3">
              <button onClick={() => setTab("today")}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all
                  ${tab==="today" ? "bg-white text-primary-500 shadow-sm" : "text-gray-400"}`}>
                ⚡ ယနေ့ ({todayCount}/{TODAY_LIMIT})
              </button>
              <button onClick={() => setTab("tomorrow")}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all
                  ${tab==="tomorrow" ? "bg-white text-primary-500 shadow-sm" : "text-gray-400"}`}>
                📅 မနက်ဖြန် ({tomorrowOrders.length}/{TOMORROW_LIMIT})
              </button>
            </div>

            {/* My orders for tab */}
            {(tab==="today" ? todayOrders : tomorrowOrders).length > 0 && (
              <div className="mb-4">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  {tab==="today" ? "ယနေ့ Orders" : "မနက်ဖြန် Orders"}
                </p>
                <div className="space-y-2">
                  {(tab==="today" ? todayOrders : tomorrowOrders).map(o => (
                    <div key={o.id} className="card flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-gray-400">#{o.id?.slice(-6).toUpperCase()}</p>
                        <p className="text-xs text-gray-600 truncate">{o.pickup?.address} → {o.dropoff?.address}</p>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full font-semibold shrink-0
                        ${o.status==="delivered" ? "bg-green-100 text-green-600" :
                          ["accepted","picked_up"].includes(o.status) ? "bg-blue-100 text-blue-600" :
                          "bg-gray-100 text-gray-500"}`}>
                        {statusLabel[o.status]}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Limit notice */}
            {((tab==="today" && !canToday) || (tab==="tomorrow" && !canTomorrow)) && (
              <div className="card text-center py-5 mb-3">
                <p className="text-2xl mb-1">🎉</p>
                <p className="text-sm font-bold text-dark">
                  {tab==="today" ? "ယနေ့ Order ပြည့်ပြီ!" : "မနက်ဖြန် Order ပြည့်ပြီ!"}
                </p>
              </div>
            )}

            {/* Available orders */}
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Available Orders</p>
              {pendingOrders.length > 0 && (
                <span className="bg-primary-100 text-primary-600 text-xs font-bold px-2 py-0.5 rounded-full">
                  {pendingOrders.length} new
                </span>
              )}
            </div>

            {pendingOrders.length === 0 ? (
              <div className="card text-center py-8">
                <p className="text-3xl mb-2">📭</p>
                <p className="text-gray-400 text-sm">Order မရှိသေးပါ</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingOrders.map(order => (
                  <div key={order.id} className="card">
                    {/* ── Header row ── */}
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="text-[10px] text-gray-400 font-bold">#{order.id?.slice(-6).toUpperCase()}</p>
                        <p className="text-xs mt-0.5">{order.paymentType==="cod" ? "💵 COD" : "✅ Cash"}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-gray-400 mb-0.5">Delivery Fee</p>
                        <p className="font-display font-black text-primary-500 text-lg leading-none">{Number(order.deliveryFee||0).toLocaleString()} ကျပ်</p>
                      </div>
                    </div>

                    {/* ── Fee breakdown ── */}
                    <div className="bg-gray-50 rounded-2xl p-3 mb-3 space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-400">💎 ပစ္စည်းတန်ဖိုး</span>
                        <span className="font-semibold">{Number(order.itemValue||0).toLocaleString()} ကျပ်</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-400">🚚 Delivery Fee</span>
                        <span className="font-semibold">{Number(order.deliveryFee||0).toLocaleString()} ကျပ်</span>
                      </div>
                      <div className="flex justify-between text-xs border-t border-gray-200 pt-1">
                        <span className="font-bold text-gray-600">💰 Customer ပေးရ</span>
                        <span className="font-bold">{(Number(order.itemValue||0)+Number(order.deliveryFee||0)).toLocaleString()} ကျပ်</span>
                      </div>
                      <div className="flex justify-between text-xs border-t border-gray-200 pt-1">
                        <span className="text-green-600 font-bold">🏍️ သင်ရမည်</span>
                        <span className="text-green-600 font-black">{Number(order.riderNet||0).toLocaleString()} ကျပ်</span>
                      </div>
                    </div>

                    {/* ── Route ── */}
                    <div className="space-y-1.5 mb-3">
                      <div className="flex items-start gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500 shrink-0 mt-1" />
                        <div>
                          <p className="text-[10px] text-gray-400">ယူမည့်နေရာ</p>
                          <p className="text-xs font-semibold text-gray-700">{order.pickup?.address}</p>
                        </div>
                      </div>
                      {order.waypoints?.map((wp, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <div className="w-2 h-2 rounded-full bg-yellow-400 shrink-0 mt-1" />
                          <div>
                            <p className="text-[10px] text-gray-400">လမ်းကြုံ {i+1}</p>
                            <p className="text-xs font-semibold text-gray-700">{wp.address}</p>
                          </div>
                        </div>
                      ))}
                      <div className="flex items-start gap-2">
                        <div className="w-2 h-2 rounded-full bg-red-500 shrink-0 mt-1" />
                        <div>
                          <p className="text-[10px] text-gray-400">ပို့မည့်နေရာ</p>
                          <p className="text-xs font-semibold text-gray-700">{order.dropoff?.address}</p>
                        </div>
                      </div>
                    </div>

                    {/* ── Customer + Item ── */}
                    <div className="flex gap-3 text-xs text-gray-500 mb-3">
                      <span>👤 {order.customerName}</span>
                      <span className="text-gray-300">·</span>
                      <span>🏷️ {order.itemTypeLabel}</span>
                    </div>

                    {/* ── Buttons ── */}
                    <div className="flex gap-2">
                      <button className="flex-1 py-3 rounded-2xl bg-gray-100 text-gray-500 text-xs font-bold">❌ ငြင်း</button>
                      <button onClick={() => handleAccept(order)}
                        disabled={accepting===order.id || (tab==="today"&&!canToday) || (tab==="tomorrow"&&!canTomorrow)}
                        className="flex-[2] py-3 rounded-2xl bg-primary-500 text-white text-sm font-bold shadow-primary disabled:opacity-40">
                        {accepting===order.id ? "လက်ခံနေသည်..." :
                          tab==="tomorrow" ? "📅 မနက်ဖြန် လက်ခံ" : "✅ ယနေ့ လက်ခံ"}
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
            <p className="text-gray-400 text-sm">Offline — Orders မမြင်ရပါ</p>
            <button onClick={handleToggleOnline} className="mt-4 btn-primary w-auto px-8">Online ဖွင့်မည်</button>
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  )
}
