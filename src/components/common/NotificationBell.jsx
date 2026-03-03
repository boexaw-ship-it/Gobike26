// src/components/common/NotificationBell.jsx
import { useState, useEffect, useRef } from "react"
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc, writeBatch } from "firebase/firestore"
import { db } from "../../firebase/config"
import { useAuth } from "../../context/AuthContext"

export default function NotificationBell() {
  const { user } = useAuth()
  const [open, setOpen]           = useState(false)
  const [notifications, setNotifications] = useState([])
  const panelRef = useRef(null)

  useEffect(() => {
    if (!user) return
    // User ရဲ့ notifications — userId field ပါသည်
    const q = query(
      collection(db, "notifications"),
      where("userId", "==", user.uid),
      where("isRead", "==", false)
    )
    const unsub = onSnapshot(q, snap => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      // client-side sort
      data.sort((a, b) => (b.createdAt?.seconds||0) - (a.createdAt?.seconds||0))
      setNotifications(data)
    }, () => {
      // index မရှိရင် fallback — orders ကနေ generate
      generateFromOrders()
    })
    return () => unsub()
  }, [user])

  // Fallback: orders ကနေ notification generate
  const generateFromOrders = () => {
    if (!user) return
    const field = user.role === "rider" ? "riderId" : "customerId"
    const q = query(
      collection(db, "orders"),
      where(field, "==", user.uid)
    )
    onSnapshot(q, snap => {
      const orders = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      orders.sort((a,b) => (b.updatedAt?.seconds||b.createdAt?.seconds||0) - (a.updatedAt?.seconds||a.createdAt?.seconds||0))

      const notifs = orders.slice(0, 10).map(o => {
        const isRider = user.role === "rider"
        const statusMsgs = {
          accepted:  isRider ? `✅ Order #${o.id?.slice(-6).toUpperCase()} လက်ခံပြီ` : `🏍️ Rider ${o.riderName || ""} လာနေသည်`,
          picked_up: `📦 Order #${o.id?.slice(-6).toUpperCase()} သယ်ဆောင်နေသည်`,
          delivered: isRider ? `🎉 Order #${o.id?.slice(-6).toUpperCase()} ပို့ပြီး ${(o.riderNet||0).toLocaleString()} ကျပ် ရရှိသည်` : `✅ Order #${o.id?.slice(-6).toUpperCase()} ရောက်ပြီ!`,
          cancelled: `❌ Order #${o.id?.slice(-6).toUpperCase()} ပယ်ဖျက်ထားသည်`,
          pending:   `📦 Order #${o.id?.slice(-6).toUpperCase()} Rider ရှာနေသည်`,
        }
        return {
          id: o.id,
          title: statusMsgs[o.status] || `Order #${o.id?.slice(-6).toUpperCase()}`,
          message: `${o.pickup?.address} → ${o.dropoff?.address}`,
          createdAt: o.updatedAt || o.createdAt,
          isRead: false,
          type: o.status,
        }
      })
      setNotifications(notifs)
    })
  }

  // Click outside close
  useEffect(() => {
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  const markAllRead = async () => {
    const batch = writeBatch(db)
    notifications.forEach(n => {
      if (n.id) batch.update(doc(db, "notifications", n.id), { isRead: true })
    })
    await batch.commit().catch(() => {})
    setNotifications([]) // optimistic clear
  }

  const timeAgo = (ts) => {
    if (!ts) return ""
    const d = ts.toDate ? ts.toDate() : new Date(ts)
    const diff = Math.floor((Date.now() - d) / 1000)
    if (diff < 60)    return "ခုနက"
    if (diff < 3600)  return `${Math.floor(diff/60)} မိနစ်က`
    if (diff < 86400) return `${Math.floor(diff/3600)} နာရီက`
    return `${Math.floor(diff/86400)} ရက်က`
  }

  const typeIcon = {
    accepted:  "🏍️",
    picked_up: "📦",
    delivered: "✅",
    cancelled: "❌",
    pending:   "⏳",
    new_order: "📦",
  }

  const unread = notifications.length

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => setOpen(!open)}
        className="relative w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center"
      >
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
              <button onClick={markAllRead} className="text-[10px] text-primary-500 font-semibold">
                အားလုံး ဖတ်ပြီး
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-2xl mb-1">🔔</p>
                <p className="text-xs text-gray-400">Notification မရှိသေးပါ</p>
              </div>
            ) : (
              notifications.map(n => (
                <div key={n.id}
                  className="px-4 py-3 border-b border-gray-50 bg-primary-50 active:bg-primary-100">
                  <div className="flex items-start gap-2">
                    <span className="text-base mt-0.5">{typeIcon[n.type] || "🔔"}</span>
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-gray-800 leading-snug">{n.title}</p>
                      {n.message && <p className="text-[10px] text-gray-500 mt-0.5 truncate">{n.message}</p>}
                      <p className="text-[10px] text-gray-400 mt-1">{timeAgo(n.createdAt)}</p>
                    </div>
                    <div className="w-2 h-2 rounded-full bg-primary-500 mt-1 shrink-0" />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
