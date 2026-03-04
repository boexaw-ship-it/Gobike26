// src/pages/rider/RiderPending.jsx
// Rider sign up ပြီးနောက် Admin approve မလုပ်ခင် ပြသည့် screen
import { useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { doc, onSnapshot } from "firebase/firestore"
import { db } from "../../firebase/config"
import { useAuth } from "../../context/AuthContext"

export default function RiderPending() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  // users/{uid} status "active" ဖြစ်လိုက်ရင် ချက်ချင်း redirect
  // riders collection ကို touch မလုပ် — freelance ဖြစ်တဲ့အတွက် users တစ်ခုတည်းပဲ approve
  useEffect(() => {
    if (!user) return
    const unsub = onSnapshot(doc(db, "users", user.uid), snap => {
      if (snap.data()?.status === "active") {
        navigate("/rider", { replace: true })
      }
    })
    return () => unsub()
  }, [user])

  return (
    <div className="min-h-screen bg-dark flex flex-col items-center justify-center px-6 text-center">
      {/* Animated clock */}
      <div className="relative mb-8">
        <div className="w-28 h-28 bg-yellow-500/20 rounded-full flex items-center justify-center border-2 border-yellow-500/30">
          <span className="text-6xl animate-pulse">⏳</span>
        </div>
        <div className="absolute inset-0 rounded-full border-2 border-yellow-500/20 animate-ping" />
      </div>

      <h2 className="text-2xl font-display font-black text-white mb-3">
        Approve လုပ်ဆဲ...
      </h2>
      <p className="text-gray-400 text-sm leading-relaxed mb-2">
        သင့်အကောင့် <span className="text-yellow-400 font-bold">Admin</span> ဆီသို့ ပေးပို့ပြီးပြီ
      </p>
      <p className="text-gray-500 text-xs mb-8">
        Admin က approve လုပ်ပြီးချင်း app ကို အလိုအလျောက် ဝင်နိုင်မည်
      </p>

      {/* Info card */}
      <div className="bg-white/5 border border-white/10 rounded-3xl px-6 py-5 w-full max-w-sm mb-8 text-left space-y-3">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">သင့်အချက်အလက်</p>
        <div className="flex justify-between text-xs">
          <span className="text-gray-400">👤 အမည်</span>
          <span className="text-white font-semibold">{user?.name}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-gray-400">📞 ဖုန်း</span>
          <span className="text-white font-semibold">{user?.phone}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-gray-400">📋 အခြေအနေ</span>
          <span className="text-yellow-400 font-bold">⏳ Pending</span>
        </div>
      </div>

      {/* Steps */}
      <div className="w-full max-w-sm space-y-2 mb-8">
        {[
          { done: true,  icon:"✅", text:"Sign Up ပြီးပြီ" },
          { done: true,  icon:"✅", text:"Admin ဆီ notification ပို့ပြီ" },
          { done: false, icon:"⏳", text:"Admin Approve လုပ်ဆဲ" },
          { done: false, icon:"🚀", text:"App သုံးနိုင်မည်" },
        ].map((s, i) => (
          <div key={i} className={`flex items-center gap-3 px-4 py-2.5 rounded-2xl
            ${s.done ? "bg-green-500/10 border border-green-500/20" : "bg-white/5 border border-white/10"}`}>
            <span className="text-base">{s.icon}</span>
            <span className={`text-xs font-semibold ${s.done ? "text-green-400" : "text-gray-400"}`}>{s.text}</span>
          </div>
        ))}
      </div>

      <button onClick={logout}
        className="text-xs text-gray-500 underline underline-offset-2">
        Logout ထွက်မည်
      </button>
    </div>
  )
}
