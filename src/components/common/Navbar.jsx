// src/components/common/Navbar.jsx
import { useAuth } from "../../context/AuthContext"
import NotificationBell from "./NotificationBell"

export default function Navbar({ title }) {
  const { user } = useAuth()

  return (
    <div className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm">
      <div className="flex items-center justify-between px-4 py-2">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <img
            src="/gobike-logo.png"
            alt="Gobike"
            className="h-9 w-9 object-contain rounded-xl"
          />
          <div className="flex items-baseline gap-1.5">
            <span className="text-lg font-display font-black text-primary-500 tracking-tight">
              Gobike
            </span>
            {title && (
              <span className="text-xs text-gray-400 font-body">/ {title}</span>
            )}
          </div>
        </div>

        {/* Right */}
        <div className="flex items-center gap-3">
          <NotificationBell />
          <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center ring-2 ring-primary-200">
            <span className="text-xs font-black text-primary-600">
              {user?.name?.charAt(0)?.toUpperCase() || "G"}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
