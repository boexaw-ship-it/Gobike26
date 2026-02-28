// src/components/common/NotificationBell.jsx
import { useState } from "react"
import { mockNotifications } from "../../data/mockNotifications"

export default function NotificationBell() {
  const [open, setOpen] = useState(false)
  const unread = mockNotifications.filter(n => !n.isRead).length

  const timeAgo = (date) => {
    const mins = Math.floor((Date.now() - date) / 60000)
    if (mins < 60) return `${mins} မိနစ်`
    return `${Math.floor(mins / 60)} နာရီ`
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center"
      >
        <span className="text-lg">🔔</span>
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-primary-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-11 w-72 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50 animate-slide-up">
          <div className="px-4 py-3 border-b border-gray-100">
            <p className="font-display font-bold text-sm">Notifications</p>
          </div>
          <div className="max-h-72 overflow-y-auto">
            {mockNotifications.map(n => (
              <div key={n.id} className={`px-4 py-3 border-b border-gray-50 ${!n.isRead ? "bg-primary-50" : ""}`}>
                <div className="flex items-start gap-2">
                  <span className="text-lg mt-0.5">
                    {n.type === "new_order" ? "📦" : "✅"}
                  </span>
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-gray-800">{n.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{n.message}</p>
                    <p className="text-[10px] text-gray-400 mt-1">{timeAgo(n.createdAt)} အကြာက</p>
                  </div>
                  {!n.isRead && (
                    <div className="w-2 h-2 rounded-full bg-primary-500 mt-1 flex-shrink-0" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
