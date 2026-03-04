// src/pages/customer/CustomerProfile.jsx
import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { doc, updateDoc, onSnapshot } from "firebase/firestore"
import { db } from "../../firebase/config"
import { useAuth } from "../../context/AuthContext"
import Navbar from "../../components/common/Navbar"
import BottomNav from "../../components/common/BottomNav"
import Toast from "../../components/common/Toast"

export default function CustomerProfile() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [userData, setUserData] = useState(null)
  const [editing, setEditing]   = useState(false)
  const [form, setForm]         = useState({ name: "", phone: "" })
  const [saving, setSaving]     = useState(false)
  const [toast, setToast]       = useState(null)

  const showToast = (msg, type = "success") => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  useEffect(() => {
    if (!user) return
    const unsub = onSnapshot(doc(db, "users", user.uid), snap => {
      if (snap.exists()) {
        const d = snap.data()
        setUserData(d)
        setForm({ name: d.name || "", phone: d.phone || "" })
      }
    })
    return () => unsub()
  }, [user])

  const handleSave = async () => {
    if (!form.name.trim()) { showToast("အမည် ထည့်ပါ", "error"); return }
    setSaving(true)
    try {
      await updateDoc(doc(db, "users", user.uid), { name: form.name, phone: form.phone })
      showToast("သိမ်းဆည်းပြီ ✅", "success")
      setEditing(false)
    } catch { showToast("Error ဖြစ်သည်", "error") }
    finally { setSaving(false) }
  }

  const handleLogout = async () => {
    await logout()
    navigate("/")
  }

  const avatar = (userData?.name || user?.name || "G").charAt(0).toUpperCase()

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <Navbar title="Profile" />
      {toast && <Toast message={toast.msg} type={toast.type} />}
      <div className="flex-1 overflow-y-auto pb-24">

        {/* ── Hero Header ── */}
        <div className="relative bg-dark overflow-hidden">
          {/* decorative circles */}
          <div className="absolute -top-10 -right-10 w-48 h-48 bg-primary-500 rounded-full opacity-20 blur-3xl" />
          <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-primary-400 rounded-full opacity-10 blur-2xl" />

          <div className="relative px-6 pt-10 pb-16 text-center">
            {/* Avatar */}
            <div className="relative inline-block mb-4">
              <div className="w-24 h-24 bg-gradient-to-br from-primary-400 to-primary-600 rounded-3xl flex items-center justify-center shadow-2xl mx-auto rotate-3">
                <span className="text-4xl font-black text-white -rotate-3">{avatar}</span>
              </div>
              <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-green-400 rounded-full border-2 border-dark flex items-center justify-center text-xs">
                🛍️
              </div>
            </div>

            <h1 className="text-2xl font-black text-white tracking-tight">
              {userData?.name || user?.name}
            </h1>
            <p className="text-gray-400 text-sm mt-1">{user?.email}</p>

            <div className="inline-flex items-center gap-1.5 mt-3 bg-primary-500/20 border border-primary-500/30 text-primary-400 text-xs font-bold px-4 py-1.5 rounded-full">
              🛍️ Customer Account
            </div>
          </div>
        </div>

        {/* ── Stats strip ── */}
        <div className="mx-4 -mt-6 relative z-10">
          <div className="bg-white rounded-3xl shadow-lg p-4 grid grid-cols-3 divide-x divide-gray-100">
            {[
              { icon: "📦", label: "Orders",   val: userData?.totalOrders || 0 },
              { icon: "✅", label: "Delivered", val: userData?.totalDelivered || 0 },
              { icon: "⭐", label: "Rating",    val: userData?.avgRating || "—" },
            ].map(s => (
              <div key={s.label} className="text-center px-2">
                <p className="text-lg mb-0.5">{s.icon}</p>
                <p className="text-lg font-black text-dark">{s.val}</p>
                <p className="text-[10px] text-gray-400">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Info Card ── */}
        <div className="mx-4 mt-4">
          <div className="bg-white rounded-3xl shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">ကိုယ်ရေးအချက်အလက်</p>
              {!editing ? (
                <button onClick={() => setEditing(true)}
                  className="flex items-center gap-1.5 text-xs font-bold text-primary-500 bg-primary-50 px-3 py-1.5 rounded-full">
                  ✏️ ပြင်မည်
                </button>
              ) : (
                <button onClick={() => setEditing(false)} className="text-xs text-gray-400 font-semibold">
                  ပယ်ဖျက်
                </button>
              )}
            </div>

            <div className="p-5 space-y-4">
              {/* Name */}
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1.5">👤 အမည်</label>
                {editing ? (
                  <input value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                    className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm font-semibold focus:outline-none focus:border-primary-400 focus:bg-white transition-all"
                    placeholder="အမည်ထည့်ပါ" />
                ) : (
                  <p className="text-sm font-bold text-dark">{userData?.name || "—"}</p>
                )}
              </div>

              {/* Phone */}
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1.5">📞 ဖုန်းနံပါတ်</label>
                {editing ? (
                  <input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})}
                    type="tel" placeholder="09xxxxxxxx"
                    className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm font-semibold focus:outline-none focus:border-primary-400 focus:bg-white transition-all" />
                ) : (
                  <p className="text-sm font-bold text-dark">{userData?.phone || "—"}</p>
                )}
              </div>

              {/* Email (read-only) */}
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1.5">✉️ Email</label>
                <p className="text-sm font-semibold text-gray-500">{user?.email}</p>
              </div>

              {editing && (
                <button onClick={handleSave} disabled={saving}
                  className="w-full bg-primary-500 text-white font-bold py-3.5 rounded-2xl shadow-primary active:scale-95 transition-all disabled:opacity-50 mt-2">
                  {saving ? "သိမ်းနေသည်..." : "💾 သိမ်းဆည်းမည်"}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ── Quick Links ── */}
        <div className="mx-4 mt-4">
          <div className="bg-white rounded-3xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-50">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">QUICK LINKS</p>
            </div>
            {[
              { icon:"📋", label:"Order မှတ်တမ်း",  sub:"ကောင်းမမြင်", path:"/customer/history" },
              { icon:"📦", label:"Order အသစ်တင်",   sub:"ပို့ဆောင်မည်", path:"/customer/order" },
              { icon:"📍", label:"Order Track လုပ်", sub:"ခြေရာခံကြည့်", path:"/customer/track" },
            ].map(item => (
              <button key={item.path} onClick={() => navigate(item.path)}
                className="w-full flex items-center gap-4 px-5 py-4 border-b border-gray-50 last:border-0 active:bg-gray-50 transition-colors">
                <div className="w-10 h-10 bg-primary-50 rounded-2xl flex items-center justify-center text-xl shrink-0">
                  {item.icon}
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-bold text-dark">{item.label}</p>
                  <p className="text-xs text-gray-400">{item.sub}</p>
                </div>
                <span className="text-gray-300 text-sm">→</span>
              </button>
            ))}
          </div>
        </div>

        {/* ── Logout ── */}
        <div className="mx-4 mt-4 mb-2">
          <button onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-4 rounded-3xl border-2 border-red-100 text-red-400 font-bold text-sm active:bg-red-50 transition-colors">
            🚪 Logout
          </button>
        </div>
      </div>
      <BottomNav />
    </div>
  )
}
