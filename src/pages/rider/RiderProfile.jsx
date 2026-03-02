// src/pages/rider/RiderProfile.jsx
import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { doc, updateDoc, onSnapshot } from "firebase/firestore"
import { db } from "../../firebase/config"
import { useAuth } from "../../context/AuthContext"
import Navbar from "../../components/common/Navbar"
import BottomNav from "../../components/common/BottomNav"

export default function RiderProfile() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [riderData, setRiderData] = useState(null)
  const [editing, setEditing]     = useState(false)
  const [form, setForm]           = useState({ name: "", phone: "", vehicle: "" })
  const [loading, setLoading]     = useState(false)
  const [saved, setSaved]         = useState(false)

  useEffect(() => {
    if (!user) return
    const unsub = onSnapshot(doc(db, "riders", user.uid), snap => {
      if (snap.exists()) {
        const data = snap.data()
        setRiderData(data)
        setForm({ name: data.name || "", phone: data.phone || "", vehicle: data.vehicle || "" })
      }
    })
    return () => unsub()
  }, [user])

  const handleSave = async () => {
    setLoading(true)
    try {
      await updateDoc(doc(db, "riders", user.uid), {
        name: form.name, phone: form.phone, vehicle: form.vehicle
      })
      setSaved(true); setEditing(false)
      setTimeout(() => setSaved(false), 2000)
    } catch { alert("Error ဖြစ်သည်") }
    finally { setLoading(false) }
  }

  const handleLogout = async () => {
    await logout()
    navigate("/")
  }

  const stats = [
    { icon: "📦", label: "Deliveries",    value: riderData?.totalDeliveries || 0 },
    { icon: "⭐", label: "Rating",         value: riderData?.rating || "4.8" },
    { icon: "🪙", label: "Coin လက်ကျန်",  value: (riderData?.coinBalance || 0).toLocaleString() },
    { icon: "💰", label: "စုစုပေါင်းရငွေ", value: (riderData?.totalEarned || 0).toLocaleString() },
  ]

  return (
    <div className="flex flex-col h-screen bg-surface">
      <Navbar title="Profile" />
      <div className="flex-1 overflow-y-auto pb-24">

        {/* Header */}
        <div className="bg-dark px-6 pt-6 pb-10 text-center">
          <div className="w-20 h-20 bg-primary-500 rounded-full flex items-center justify-center mx-auto mb-3 shadow-primary">
            <span className="text-3xl font-display font-black text-white">
              {user?.name?.charAt(0)?.toUpperCase()}
            </span>
          </div>
          <h2 className="text-xl font-display font-black text-white">{user?.name}</h2>
          <p className="text-gray-400 text-xs mt-1">{user?.email}</p>
          <span className="inline-block mt-2 bg-primary-500/20 text-primary-400 text-xs px-3 py-1 rounded-full font-semibold">
            🏍️ Rider
          </span>
          {riderData?.isOnline && (
            <div className="flex items-center justify-center gap-1 mt-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-green-400 text-xs font-semibold">Online</span>
            </div>
          )}
        </div>

        <div className="px-4 -mt-4">
          {/* Stats */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            {stats.map(s => (
              <div key={s.label} className="card text-center">
                <p className="text-xl mb-1">{s.icon}</p>
                <p className="font-display font-black text-dark text-base">{s.value}</p>
                <p className="text-[10px] text-gray-400">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Edit form */}
          <div className="card mb-4">
            {saved && (
              <div className="bg-green-50 text-green-600 text-xs px-3 py-2 rounded-xl mb-3">✅ သိမ်းဆည်းပြီးပါပြီ</div>
            )}
            <div className="flex justify-between items-center mb-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">ကိုယ်ရေးအချက်အလက်</p>
              <button onClick={() => setEditing(!editing)} className="text-xs text-primary-500 font-semibold">
                {editing ? "ပယ်ဖျက်" : "✏️ ပြင်မည်"}
              </button>
            </div>
            <div className="space-y-3">
              {[
                { label: "အမည်",    key: "name",    type: "text",  placeholder: "နာမည်" },
                { label: "ဖုန်း",    key: "phone",   type: "tel",   placeholder: "09xxxxxxxx" },
                { label: "ယာဉ်",    key: "vehicle", type: "text",  placeholder: "မော်တော်ဆိုင်ကယ် ဘုတ်နံပါတ်" },
              ].map(({ label, key, type, placeholder }) => (
                <div key={key}>
                  <label className="text-xs text-gray-400 mb-1 block">{label}</label>
                  {editing ? (
                    <input type={type} placeholder={placeholder} value={form[key]}
                      onChange={e => setForm({ ...form, [key]: e.target.value })} className="input-field" />
                  ) : (
                    <p className="text-sm font-semibold text-gray-700">{riderData?.[key] || "-"}</p>
                  )}
                </div>
              ))}
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Email</label>
                <p className="text-sm font-semibold text-gray-700">{user?.email}</p>
              </div>
            </div>
            {editing && (
              <button onClick={handleSave} disabled={loading} className="btn-primary mt-4 disabled:opacity-50">
                {loading ? "သိမ်းနေသည်..." : "💾 သိမ်းဆည်းမည်"}
              </button>
            )}
          </div>

          {/* Quick links */}
          <div className="card mb-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Quick Links</p>
            {[
              { icon: "📋", label: "Delivery မှတ်တမ်း", path: "/rider/history" },
              { icon: "💰", label: "Wallet ကြည့်",      path: "/rider/wallet" },
            ].map(item => (
              <button key={item.path} onClick={() => navigate(item.path)}
                className="w-full flex items-center gap-3 py-3 text-left border-b border-gray-50 last:border-0">
                <span className="text-xl">{item.icon}</span>
                <span className="text-sm font-semibold text-gray-700">{item.label}</span>
                <span className="ml-auto text-gray-300">→</span>
              </button>
            ))}
          </div>

          <button onClick={handleLogout} className="w-full py-4 rounded-2xl border border-red-200 text-red-500 font-bold text-sm">
            🚪 Logout
          </button>
        </div>
      </div>
      <BottomNav />
    </div>
  )
}
