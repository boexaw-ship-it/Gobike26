// src/components/common/Navbar.jsx
import { useAuth } from "../../context/AuthContext"
import NotificationBell from "./NotificationBell"

export default function Navbar({ title }) {
  const { user } = useAuth()

  return (
    <div className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-xl font-display font-bold text-primary-500">🚴 Gobike</span>
          {title && (
            <span className="text-sm text-gray-400 font-body">/ {title}</span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <NotificationBell />
          <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
            <span className="text-xs font-bold text-primary-600">
              {user?.name?.charAt(0) || "G"}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
