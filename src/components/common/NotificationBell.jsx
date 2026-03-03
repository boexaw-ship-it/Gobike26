// src/components/common/NotificationBell.jsx
import { useState, useEffect, useRef } from "react"
import { collection, query, where, onSnapshot } from "firebase/firestore"
import { db } from "../../firebase/config"
import { useAuth } from "../../context/AuthContext"

export default function NotificationBell() {
  const { user } = useAuth()
  const [open, setOpen]   = useState(false)
  const [notifs, setNotifs] = useState([])
  const [seen, setSeen]   = useState(new Set()) // seen order IDs + status
  const panelRef = useRef(null)
  const prevRef  = useRef([])

  useEffect(() => {
    if (!user) return
    const field = user.role === "rider" ? "riderId" : "customerId"
    const q = query(collection(db, "orders"), where(field, "==", user.uid))

    const unsub = onSnapshot(q, snap => {
      const orders = snap.docs.map(d => ({ id:d.id, ...d.data() }))
      const newNotifs = []

      orders.forEach(order => {
        const key = `${order.id}_${order.status}`
        const prevOrder = prevRef.current.find(o => o.id === order.id)

        // Status ပြောင်းသွားရင် notification ထည့်
        if (prevOrder && prevOrder.status !== order.status && !seen.has(key)) {
          newNotifs.push(buildNotif(order, user.role))
        }
        // ပထမဆုံး load မဟုတ်ဘဲ new order ဆို
        if (!prevOrder && prevRef.current.length > 0 && user.role === "rider" && order.status === "pending") {
          newNotifs.push({ id: key, title:"📦 Order သစ် ဝင်လာပြီ!", message:`${order.pickup?.address} → ${order.dropoff?.address}`, icon:"📦", ts: Date.now() })
        }
      })

      prevRef.current = orders

      if (newNotifs.length > 0) {
        setSeen(prev => {
          const next = new Set(prev)
          newNotifs.forEach(n => next.add(n.id))
          return next
        })
        setNotifs(prev => [...newNotifs, ...prev].slice(0, 20))
      }
    })
    return () => unsub()
  }, [user])

  function buildNotif(order, role) {
    const id   = `${order.id}_${order.status}`
    const ts   = Date.now()
    const isRider = role === "rider"
    const msgs = {
      accepted:  isRider
        ? { title:`✅ Order #${order.id?.slice(-6).toUpperCase()} လက်ခံပြီ`, icon:"✅" }
        : { title:`🏍️ Rider ${order.riderName||""} လာနေသည်`, icon:"🏍️" },
      picked_up: { title:`📦 Order #${order.id?.slice(-6).toUpperCase()} သယ်ဆောင်နေသည်`, icon:"📦" },
      delivered: isRider
        ? { title:`🎉 Delivery ပြီး! ${Number(order.riderNet||0).toLocaleString()} ကျပ် ရရှိသည်`, icon:"🎉" }
        : { title:`✅ Order ရောက်ပြီ! #${order.id?.slice(-6).toUpperCase()}`, icon:"✅" },
      cancelled: { title:`❌ Order #${order.id?.slice(-6).toUpperCase()} ပယ်ဖျက်ထားသည်`, icon:"❌" },
    }
    const m = msgs[order.status] || { title:`Order #${order.id?.slice(-6).toUpperCase()} update`, icon:"🔔" }
    return { id, title:m.title, icon:m.icon, message:`${order.pickup?.address} → ${order.dropoff?.address}`, ts }
  }

  // Click outside close
  useEffect(() => {
    const handler = e => {
      if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  const unread = notifs.length

  const timeAgo = (ts) => {
    const diff = Math.floor((Date.now() - ts) / 1000)
    if (diff < 60) return "ခုနက"
    if (diff < 3600) return `${Math.floor(diff/60)} မိနစ်က`
    return `${Math.floor(diff/3600)} နာရီက`
  }

  return (
    <div className="relative" ref={panelRef}>
      <button onClick={() => setOpen(!open)}
        className="relative w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center">
        <span className="text-lg">🔔</span>
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-primary-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-11 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50 animate-slide-up">
          <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center">
            <p className="font-display font-bold text-sm">Notifications</p>
            {unread > 0 && (
              <button onClick={() => setNotifs([])} className="text-[10px] text-primary-500 font-semibold">
                ရှင်းလင်း
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {notifs.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-2xl mb-1">🔔</p>
                <p className="text-xs text-gray-400">Notification မရှိသေးပါ</p>
              </div>
            ) : notifs.map(n => (
              <div key={n.id} className="px-4 py-3 border-b border-gray-50 bg-primary-50">
                <div className="flex items-start gap-2">
                  <span className="text-base mt-0.5">{n.icon}</span>
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-gray-800 leading-snug">{n.title}</p>
                    {n.message && <p className="text-[10px] text-gray-500 mt-0.5 truncate">{n.message}</p>}
                    <p className="text-[10px] text-gray-400 mt-1">{timeAgo(n.ts)}</p>
                  </div>
                  <div className="w-2 h-2 rounded-full bg-primary-500 mt-1 shrink-0" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
