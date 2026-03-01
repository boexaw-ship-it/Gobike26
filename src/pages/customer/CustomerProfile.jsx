// src/pages/customer/CustomerProfile.jsx
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { doc, updateDoc } from "firebase/firestore"
import { db } from "../../firebase/config"
import { useAuth } from "../../context/AuthContext"
import Navbar from "../../components/common/Navbar"
import BottomNav from "../../components/common/BottomNav"

export default function CustomerProfile() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ name: user?.name || "", phone: user?.phone || "" })
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)

  const handleSave = async () => {
    setLoading(true)
    try {
      await updateDoc(doc(db, "users", user.uid), {
        name: form.name, phone: form.phone
      })
      setSaved(true)
      setEditing(false)
      setTimeout(() => setSaved(false), 2000)
    } catch (err) {
      alert("သိမ်းဆည်းရာတွင် အမှားတစ်ခုဖြစ်သည်")
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await logout()
    navigate("/")
  }

  return (
    <div className="flex flex-col h-screen bg-surface">
      <Navbar title="Profile" />
      <div className="flex-1 overflow-y-auto pb-24">

        {/* Avatar */}
        <div className="bg-dark px-6 pt-6 pb-10 text-center relative">
          <div className="w-20 h-20 bg-primary-500 rounded-full flex items-center justify-center mx-auto mb-3 shadow-primary">
            <span className="text-3xl font-display font-black text-white">
              {user?.name?.charAt(0)?.toUpperCase()}
            </span>
          </div>
          <h2 className="text-xl font-display font-black text-white">{user?.name}</h2>
          <p className="text-gray-400 text-xs mt-1">{user?.email}</p>
          <span className="inline-block mt-2 bg-primary-500/20 text-primary-400 text-xs px-3 py-1 rounded-full font-semibold">
            🛍️ Customer
          </span>
        </div>

        <div className="px-4 -mt-4">
          <div className="card mb-4">
            {saved && (
              <div className="bg-green-50 text-green-600 text-xs px-3 py-2 rounded-xl mb-3">
                ✅ သိမ်းဆည်းပြီးပါပြီ
              </div>
            )}

            <div className="flex justify-between items-center mb-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">ကိုယ်ရေးအချက်အလက်</p>
              <button onClick={() => setEditing(!editing)}
                className="text-xs text-primary-500 font-semibold">
                {editing ? "ပယ်ဖျက်" : "✏️ ပြင်မည်"}
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">အမည်</label>
                {editing ? (
                  <input value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                    className="input-field" />
                ) : (
                  <p className="text-sm font-semibold text-gray-700">{user?.name}</p>
                )}
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">ဖုန်းနံပါတ်</label>
                {editing ? (
                  <input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})}
                    className="input-field" />
                ) : (
                  <p className="text-sm font-semibold text-gray-700">{user?.phone || "-"}</p>
                )}
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Email</label>
                <p className="text-sm font-semibold text-gray-700">{user?.email}</p>
              </div>
            </div>

            {editing && (
              <button onClick={handleSave} disabled={loading} className="btn-primary mt-4">
                {loading ? "သိမ်းနေသည်..." : "💾 သိမ်းဆည်းမည်"}
              </button>
            )}
          </div>

          <div className="card mb-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Quick Links</p>
            <div className="space-y-2">
              <button onClick={() => navigate("/customer/history")}
                className="w-full flex items-center gap-3 py-3 text-left">
                <span className="text-xl">📋</span>
                <span className="text-sm font-semibold text-gray-700">Order မှတ်တမ်း</span>
                <span className="ml-auto text-gray-300">→</span>
              </button>
              <button onClick={() => navigate("/customer/order")}
                className="w-full flex items-center gap-3 py-3 text-left">
                <span className="text-xl">📦</span>
                <span className="text-sm font-semibold text-gray-700">Order အသစ်တင်</span>
                <span className="ml-auto text-gray-300">→</span>
              </button>
            </div>
          </div>

          <button onClick={handleLogout}
            className="w-full py-4 rounded-2xl border border-red-200 text-red-500 font-bold text-sm">
            🚪 Logout
          </button>
        </div>
      </div>
      <BottomNav />
    </div>
  )
}
