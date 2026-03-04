// src/pages/admin/AdminDashboard.jsx
import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import {
  collection, query, where, onSnapshot,
  doc, updateDoc, orderBy, limit, serverTimestamp
} from "firebase/firestore"
import { db } from "../../firebase/config"
import Toast from "../../components/common/Toast"

const STATUS_STYLE = {
  pending:   "bg-yellow-100 text-yellow-600",
  accepted:  "bg-blue-100 text-blue-600",
  picked_up: "bg-purple-100 text-purple-600",
  delivered: "bg-green-100 text-green-600",
  cancelled: "bg-red-100 text-red-500",
}
const STATUS_TEXT = {
  pending:"⏳ Pending", accepted:"🏍️ လာနေ",
  picked_up:"📦 သယ်", delivered:"✅ ပို့ပြီး", cancelled:"❌ ပယ်",
}

async function sendTelegram(text) {
  const BOT  = import.meta.env.VITE_TELEGRAM_BOT_TOKEN
  const CHAT = import.meta.env.VITE_TELEGRAM_ADMIN_CHAT_ID
  if (!BOT || !CHAT) return
  await fetch(`https://api.telegram.org/bot${BOT}/sendMessage`, {
    method:"POST", headers:{"Content-Type":"application/json"},
    body: JSON.stringify({ chat_id:CHAT, text, parse_mode:"HTML" }),
  }).catch(()=>{})
}

export default function AdminDashboard() {
  const navigate = useNavigate()
  const [orders, setOrders]           = useState([])
  const [riders, setRiders]           = useState([])
  const [pendingRiders, setPendingRiders] = useState([])
  const [tab, setTab]                 = useState("overview")
  const [toast, setToast]             = useState(null)
  const [approvingId, setApprovingId] = useState(null)

  const showToast = (msg, type="success") => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  // ── Orders real-time ──
  useEffect(() => {
    const q = query(collection(db,"orders"), orderBy("createdAt","desc"), limit(100))
    return onSnapshot(q, snap => {
      setOrders(snap.docs.map(d => ({ id:d.id, ...d.data() })))
    }, () => {})
  }, [])

  // ── Riders real-time ──
  useEffect(() => {
    return onSnapshot(collection(db,"riders"), snap => {
      setRiders(snap.docs.map(d => ({ id:d.id, ...d.data() })))
    }, () => {})
  }, [])

  // ── Pending riders (users collection, status=pending, role=rider) ──
  useEffect(() => {
    const q = query(
      collection(db,"users"),
      where("role","==","rider"),
      where("status","==","pending")
    )
    return onSnapshot(q, snap => {
      setPendingRiders(snap.docs.map(d => ({ id:d.id, ...d.data() })))
    }, () => {})
  }, [])

  // ── Approve rider ──
  const handleApprove = async (rider) => {
    setApprovingId(rider.id)
    try {
      await updateDoc(doc(db,"users", rider.id), {
        status: "active", approvedAt: serverTimestamp()
      })
      await sendTelegram(
        `✅ <b>Rider Approved!</b>\n👤 ${rider.name}\n📞 ${rider.phone}\n\nApp သုံးနိုင်ပြီ 🚀`
      )
      showToast(`${rider.name} Approve ပြီး ✅`)
    } catch { showToast("Error ဖြစ်သည်", "error") }
    finally { setApprovingId(null) }
  }

  // ── Stats ──
  const onlineRiders    = riders.filter(r => r.isOnline).length
  const activeOrders    = orders.filter(o => ["accepted","picked_up"].includes(o.status)).length
  const pendingOrders   = orders.filter(o => o.status==="pending").length
  const todayDelivered  = orders.filter(o => {
    if (o.status !== "delivered") return false
    const d = o.deliveredAt?.toDate?.() || new Date(0)
    const start = new Date(); start.setHours(0,0,0,0)
    return d >= start
  }).length
  const todayRevenue = orders.filter(o => {
    if (o.status !== "delivered") return false
    const d = o.deliveredAt?.toDate?.() || new Date(0)
    const start = new Date(); start.setHours(0,0,0,0)
    return d >= start
  }).reduce((s,o) => s + (o.commission||0), 0)

  const timeAgo = (ts) => {
    if (!ts) return ""
    const d = ts.toDate ? ts.toDate() : new Date(ts)
    const diff = Math.floor((Date.now()-d)/1000)
    if (diff < 60) return "ခုနက"
    if (diff < 3600) return `${Math.floor(diff/60)}မိနစ်`
    if (diff < 86400) return `${Math.floor(diff/3600)}နာရီ`
    return `${Math.floor(diff/86400)}ရက်`
  }

  const tabs = [
    { key:"overview", label:"📊 Overview" },
    { key:"orders",   label:"📦 Orders" },
    { key:"riders",   label:"🏍️ Riders" },
    { key:"approve",  label:`⏳ Approve${pendingRiders.length > 0 ? ` (${pendingRiders.length})` : ""}` },
  ]

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {toast && <Toast message={toast.msg} type={toast.type} />}

      {/* Header */}
      <div className="bg-dark px-4 pt-10 pb-4 sticky top-0 z-40">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <img src="/gobike-logo.png" alt="Gobike"
              className="w-8 h-8 rounded-xl object-contain"
              onError={e => e.target.style.display="none"} />
            <div>
              <p className="text-white font-black text-sm leading-none">Gobike Admin</p>
              <p className="text-gray-500 text-[10px]">Dashboard ⚙️</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {pendingRiders.length > 0 && (
              <div className="bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-full animate-pulse">
                {pendingRiders.length} pending
              </div>
            )}
            <button onClick={() => navigate("/admin/map")}
              className="bg-primary-500 text-white text-xs font-bold px-3 py-1.5 rounded-xl">
              🗺️ Live Map
            </button>
          </div>
        </div>
        {/* Tabs */}
        <div className="flex gap-1 overflow-x-auto no-scrollbar">
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold transition-all
                ${tab===t.key ? "bg-primary-500 text-white" : "bg-white/10 text-gray-400"}`}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-6">

        {/* ── Overview Tab ── */}
        {tab === "overview" && (
          <div className="px-4 pt-4 space-y-4">
            {/* Stats */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { icon:"🏍️", val:onlineRiders,   sub:`/ ${riders.length} Riders`,   color:"bg-green-50 text-green-600",  label:"Online" },
                { icon:"📦", val:activeOrders,    sub:"Active deliveries",           color:"bg-blue-50 text-blue-600",    label:"Active Orders" },
                { icon:"⏳", val:pendingOrders,   sub:"Rider မရသေး",                 color:"bg-yellow-50 text-yellow-600",label:"Pending" },
                { icon:"💰", val:todayRevenue.toLocaleString(), sub:`${todayDelivered} deliveries`, color:"bg-primary-50 text-primary-600", label:"ယနေ့ Commission" },
              ].map(s => (
                <div key={s.label} className="bg-white rounded-3xl p-4 shadow-sm">
                  <div className={`w-10 h-10 rounded-2xl ${s.color} flex items-center justify-center text-xl mb-2`}>{s.icon}</div>
                  <p className="font-display font-black text-xl text-dark">{s.val}</p>
                  <p className="text-[10px] text-gray-400">{s.sub}</p>
                  <p className="text-xs font-bold text-gray-600 mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Quick links */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { icon:"🗺️", label:"Live Map",      sub:"Riders ကြည့်",     path:"/admin/map" },
                { icon:"💰", label:"Wallet",         sub:"Coin ဖြည့်",       path:"/admin/wallet" },
              ].map(item => (
                <button key={item.path} onClick={() => navigate(item.path)}
                  className="bg-white rounded-3xl p-4 shadow-sm flex items-center gap-3 active:scale-95 transition-all">
                  <div className="w-10 h-10 bg-primary-50 rounded-2xl flex items-center justify-center text-xl">{item.icon}</div>
                  <div className="text-left">
                    <p className="text-sm font-bold text-dark">{item.label}</p>
                    <p className="text-xs text-gray-400">{item.sub}</p>
                  </div>
                </button>
              ))}
            </div>

            {/* Recent orders preview */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Recent Orders</p>
                <button onClick={() => setTab("orders")} className="text-xs text-primary-500 font-bold">အားလုံး →</button>
              </div>
              <div className="space-y-2">
                {orders.slice(0,5).map(o => (
                  <div key={o.id} className="bg-white rounded-2xl px-4 py-3 flex justify-between items-center shadow-sm">
                    <div>
                      <p className="text-xs font-bold text-gray-400">#{o.id?.slice(-6).toUpperCase()}</p>
                      <p className="text-xs text-gray-600 truncate max-w-[180px]">{o.pickup?.township} → {o.dropoff?.township}</p>
                      <p className="text-[10px] text-gray-400">{o.customerName} · {timeAgo(o.createdAt)}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full font-bold shrink-0 ${STATUS_STYLE[o.status]}`}>
                      {STATUS_TEXT[o.status]}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Orders Tab ── */}
        {tab === "orders" && (
          <div className="px-4 pt-4">
            {/* Filter chips */}
            <div className="flex gap-2 overflow-x-auto mb-3 no-scrollbar">
              {[["all","အားလုံး"],["pending","⏳ Pending"],["accepted","🏍️ Active"],["delivered","✅ ပြီး"],["cancelled","❌ ပယ်"]].map(([v,l]) => (
                <button key={v} className="shrink-0 px-3 py-1.5 bg-white rounded-full text-xs font-semibold border border-gray-200 text-gray-600">
                  {l}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-400 mb-3">စုစုပေါင်း {orders.length} ခု</p>
            <div className="space-y-2">
              {orders.map(o => (
                <div key={o.id} className="bg-white rounded-2xl p-4 shadow-sm">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className="text-xs font-bold text-gray-400">#{o.id?.slice(-6).toUpperCase()}</span>
                      <span className={`ml-2 text-xs px-2 py-0.5 rounded-full font-bold ${STATUS_STYLE[o.status]}`}>
                        {STATUS_TEXT[o.status]}
                      </span>
                    </div>
                    <span className="text-xs text-gray-400">{timeAgo(o.createdAt)}</span>
                  </div>
                  <p className="text-xs text-gray-600 mb-0.5">📦 {o.pickup?.address}</p>
                  <p className="text-xs text-gray-600 mb-1">🎯 {o.dropoff?.address}</p>
                  <div className="flex gap-3 text-xs text-gray-400 mb-2">
                    <span>👤 {o.customerName}</span>
                    {o.riderName && <><span>·</span><span>🏍️ {o.riderName}</span></>}
                  </div>
                  <div className="bg-gray-50 rounded-xl px-3 py-2 flex justify-between">
                    <div className="text-xs text-gray-400">
                      <span>💎 {Number(o.itemValue||0).toLocaleString()}</span>
                      <span className="mx-1">+</span>
                      <span>🚚 {Number(o.deliveryFee||0).toLocaleString()}</span>
                    </div>
                    <span className="text-xs font-black text-primary-500">
                      Commission: {Number(o.commission||0).toLocaleString()} ကျပ်
                    </span>
                  </div>
                  {o.hiddenByCustomer && <p className="text-[10px] text-gray-300 mt-1">👁️ Customer မှ ဖျောက်ထား</p>}
                  {o.hiddenByRider    && <p className="text-[10px] text-gray-300 mt-1">👁️ Rider မှ ဖျောက်ထား</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Riders Tab ── */}
        {tab === "riders" && (
          <div className="px-4 pt-4 space-y-3">
            <div className="grid grid-cols-3 gap-2 mb-3">
              <div className="bg-white rounded-2xl p-3 text-center shadow-sm">
                <p className="font-black text-lg text-dark">{riders.length}</p>
                <p className="text-[10px] text-gray-400">Total</p>
              </div>
              <div className="bg-white rounded-2xl p-3 text-center shadow-sm">
                <p className="font-black text-lg text-green-500">{onlineRiders}</p>
                <p className="text-[10px] text-gray-400">Online</p>
              </div>
              <div className="bg-white rounded-2xl p-3 text-center shadow-sm">
                <p className="font-black text-lg text-yellow-500">{pendingRiders.length}</p>
                <p className="text-[10px] text-gray-400">Pending</p>
              </div>
            </div>
            {riders.length === 0 ? (
              <div className="text-center py-12"><p className="text-gray-400 text-sm">Rider မရှိသေးပါ</p></div>
            ) : riders.map(r => (
              <div key={r.id} className="bg-white rounded-2xl p-4 shadow-sm">
                <div className="flex items-center gap-3 mb-2">
                  <div className="relative">
                    <div className="w-10 h-10 bg-primary-100 rounded-2xl flex items-center justify-center font-black text-primary-600">
                      {r.name?.charAt(0)}
                    </div>
                    <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${r.isOnline ? "bg-green-500" : "bg-gray-300"}`} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-dark">{r.name}</p>
                    <p className="text-xs text-gray-400">{r.phone}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-xs font-bold ${r.isOnline ? "text-green-500" : "text-gray-400"}`}>
                      {r.isOnline ? "● Online" : "○ Offline"}
                    </p>
                    <p className="text-xs text-gray-400">⭐ {r.rating||"5.0"}</p>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-xl px-3 py-2 flex justify-between text-xs">
                  <span className="text-gray-400">🪙 {Number(r.coinBalance||0).toLocaleString()} ကျပ်</span>
                  <span className="text-gray-400">📦 {r.totalDeliveries||0} deliveries</span>
                  <span className="text-gray-400">💰 {Number(r.totalEarned||0).toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Approve Tab ── */}
        {tab === "approve" && (
          <div className="px-4 pt-4">
            {pendingRiders.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-4xl mb-3">✅</p>
                <p className="text-sm font-bold text-gray-600">Pending Rider မရှိပါ</p>
                <p className="text-xs text-gray-400 mt-1">Rider အသစ် sign up လုပ်ရင် ဒီမှာ ပေါ်မည်</p>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-xs text-gray-500">{pendingRiders.length} ယောက် Approve စောင့်နေသည်</p>
                {pendingRiders.map(rider => (
                  <div key={rider.id} className="bg-white rounded-3xl p-5 shadow-sm border-2 border-yellow-200">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 bg-yellow-100 rounded-2xl flex items-center justify-center font-black text-yellow-600 text-lg">
                        {rider.name?.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-dark">{rider.name}</p>
                        <p className="text-xs text-gray-400">{rider.email}</p>
                        <span className="text-[10px] bg-yellow-100 text-yellow-600 font-bold px-2 py-0.5 rounded-full">
                          ⏳ Pending
                        </span>
                      </div>
                    </div>
                    {/* Rider details from riders collection */}
                    <RiderDetails uid={rider.id} />
                    <button
                      onClick={() => handleApprove(rider)}
                      disabled={approvingId === rider.id}
                      className="w-full mt-4 bg-green-500 text-white font-bold py-3.5 rounded-2xl text-sm shadow-sm active:scale-95 transition-all disabled:opacity-50">
                      {approvingId === rider.id ? "Approve လုပ်နေသည်..." : "✅ Approve လုပ်မည်"}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// Sub-component: load rider details from riders collection
function RiderDetails({ uid }) {
  const [data, setData] = useState(null)
  useEffect(() => {
    const unsub = onSnapshot(doc(db,"riders",uid), snap => {
      if (snap.exists()) setData(snap.data())
    })
    return () => unsub()
  }, [uid])

  if (!data) return null
  const VEHICLE_LABELS = {
    wave125:"Wave 125", click125:"Click 125", dream:"Dream",
    airblade:"Air Blade", other_bike:"Bike (အခြား)", car:"Car", van:"Van/Truck",
  }
  return (
    <div className="bg-gray-50 rounded-2xl p-3 space-y-1.5">
      {[
        ["📞 ဖုန်း",           data.phone],
        ["🏍️ ယဉ်အမျိုးအစား", VEHICLE_LABELS[data.vehicleType] || data.vehicleType],
        ["🔢 License Plate",  data.licensePlate],
        ["🪪 NRC",            data.nrc],
        ["📍 လိပ်စာ",          data.address],
      ].map(([k,v]) => v && (
        <div key={k} className="flex justify-between text-xs">
          <span className="text-gray-400">{k}</span>
          <span className="font-semibold text-gray-700 text-right max-w-[60%]">{v}</span>
        </div>
      ))}
    </div>
  )
}
