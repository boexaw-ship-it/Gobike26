// src/components/common/BottomNav.jsx
import { useNavigate, useLocation } from "react-router-dom"
import { useAuth } from "../../context/AuthContext"

const customerNav = [
  { path: "/customer",         icon: "🏠", label: "Home" },
  { path: "/customer/order",   icon: "📦", label: "Order" },
  { path: "/customer/track",   icon: "📍", label: "Track" },
  { path: "/customer/history", icon: "📋", label: "History" },
  { path: "/customer/profile", icon: "👤", label: "Profile" },
]

const riderNav = [
  { path: "/rider",            icon: "🏠", label: "Home" },
  { path: "/rider/delivery",   icon: "🚴", label: "Active" },
  { path: "/rider/wallet",     icon: "🪙", label: "Wallet" },
  { path: "/rider/history",    icon: "📋", label: "History" },
  { path: "/rider/profile",    icon: "👤", label: "Profile" },
]

const adminNav = [
  { path: "/admin",        icon: "📊", label: "Dashboard" },
  { path: "/admin/riders", icon: "🏍️", label: "Riders" },
  { path: "/admin/wallet", icon: "💰", label: "Wallet" },
  { path: "/admin/map",    icon: "🗺️", label: "Map" },
]

export default function BottomNav() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const navItems =
    user?.role === "customer" ? customerNav :
    user?.role === "rider"    ? riderNav    : adminNav

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white shadow-bottom-nav border-t border-gray-100">
      <div className="flex items-center justify-around px-1 py-2 max-w-md mx-auto">
        {navItems.map(item => {
          const active = location.pathname === item.path
          return (
            <button key={item.path} onClick={() => navigate(item.path)}
              className={`bottom-nav-item flex-1 ${active ? "bg-primary-50" : ""}`}>
              <span className="text-lg">{item.icon}</span>
              <span className={`text-[9px] font-semibold ${active ? "text-primary-500" : "text-gray-400"}`}>
                {item.label}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
