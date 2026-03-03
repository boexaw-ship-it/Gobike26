// src/components/common/Toast.jsx
// Custom toast — browser alert အစား သုံးမည်
export default function Toast({ message, type = "success" }) {
  const styles = {
    success: "bg-green-500",
    error:   "bg-red-500",
    warn:    "bg-orange-500",
    info:    "bg-blue-500",
  }
  const icons = { success:"✅", error:"❌", warn:"⚠️", info:"ℹ️" }
  return (
    <div className={`fixed top-16 left-4 right-4 z-[999] ${styles[type]} text-white rounded-2xl px-4 py-3 flex items-center gap-3 shadow-xl animate-slide-up`}>
      <span className="text-lg shrink-0">{icons[type]}</span>
      <p className="text-sm font-semibold leading-snug">{message}</p>
    </div>
  )
}
