// src/pages/auth/SignUp.jsx
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { createUserWithEmailAndPassword } from "firebase/auth"
import { doc, setDoc, serverTimestamp } from "firebase/firestore"
import { auth, db } from "../../firebase/config"

const VEHICLE_TYPES = [
  { value: "wave125",    label: "🏍️ Wave 125" },
  { value: "click125",   label: "🏍️ Click 125" },
  { value: "dream",      label: "🏍️ Dream" },
  { value: "airblade",   label: "🏍️ Air Blade" },
  { value: "other_bike", label: "🏍️ အခြား Bike" },
  { value: "car",        label: "🚗 Car" },
  { value: "van",        label: "🚐 Van / Truck" },
]

export default function SignUp() {
  const navigate  = useNavigate()
  const [role, setRole]     = useState("customer")
  const [step, setStep]     = useState(1) // rider only: step 1 basic, step 2 vehicle info
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState("")
  const [showPw, setShowPw] = useState(false)

  // Common fields
  const [name, setName]         = useState("")
  const [email, setEmail]       = useState("")
  const [phone, setPhone]       = useState("")
  const [password, setPassword] = useState("")

  // Rider-only fields
  const [vehicleType, setVehicleType] = useState("")
  const [licensePlate, setLicensePlate] = useState("")
  const [nrc, setNrc]           = useState("")
  const [address, setAddress]   = useState("")

  const basicValid = name && email && phone && password.length >= 6

  const handleSubmit = async () => {
    if (!basicValid) return
    if (role === "rider" && (!vehicleType || !licensePlate || !nrc || !address)) {
      setError("အချက်အလက်များ အပြည့်အစုံ ဖြည့်ပါ")
      return
    }
    setLoading(true)
    setError("")
    try {
      const { user } = await createUserWithEmailAndPassword(auth, email, password)

      const userData = {
        name, email, phone,
        role,
        status: role === "rider" ? "pending" : "active",
        createdAt: serverTimestamp(),
      }
      await setDoc(doc(db, "users", user.uid), userData)

      if (role === "rider") {
        await setDoc(doc(db, "riders", user.uid), {
          name, email, phone,
          vehicleType, licensePlate, nrc, address,
          isOnline: false,
          coinBalance: 0,
          totalEarned: 0, totalCommission: 0,
          rating: 5.0, totalDeliveries: 0,
          createdAt: serverTimestamp(),
        })

        // Telegram notification to admin
        const BOT  = import.meta.env.VITE_TELEGRAM_BOT_TOKEN
        const CHAT = import.meta.env.VITE_TELEGRAM_ADMIN_CHAT_ID
        if (BOT && CHAT) {
          const text = `🆕 <b>Rider အသစ် လျှောက်ထားပြီ!</b>
━━━━━━━━━━━━━━━━
👤 <b>အမည်:</b> ${name}
📞 <b>ဖုန်း:</b> ${phone}
✉️ <b>Email:</b> ${email}
━━━━━━━━━━━━━━━━
🏍️ <b>ယဉ်အမျိုးအစား:</b> ${VEHICLE_TYPES.find(v=>v.value===vehicleType)?.label || vehicleType}
🔢 <b>License Plate:</b> ${licensePlate}
🪪 <b>NRC:</b> ${nrc}
📍 <b>လိပ်စာ:</b> ${address}
━━━━━━━━━━━━━━━━
⏳ Firebase Console ကနေ Approve လုပ်ပေးပါ`
          fetch(`https://api.telegram.org/bot${BOT}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ chat_id: CHAT, text, parse_mode: "HTML" }),
          }).catch(() => {})
        }
      }

      if (role === "rider") {
        navigate("/rider/pending") // pending approval screen
      } else {
        navigate("/customer")
      }
    } catch (err) {
      const msgs = {
        "auth/email-already-in-use": "Email ဒီနေရာမှာ ရှိပြီးသား ဖြစ်နေသည်",
        "auth/invalid-email":        "Email မှားနေသည်",
        "auth/weak-password":        "Password အနည်းဆုံး ၆ လုံး ထည့်ပါ",
      }
      setError(msgs[err.code] || err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-surface flex flex-col">

      {/* Header */}
      <div className="bg-dark px-6 pt-12 pb-8 relative overflow-hidden shrink-0">
        <div className="absolute top-0 right-0 w-40 h-40 bg-primary-500 rounded-full opacity-15 blur-2xl -translate-y-1/2 translate-x-1/2" />
        <button onClick={() => navigate("/")} className="text-gray-400 text-sm mb-4 flex items-center gap-1">
          ← ပြန်သွား
        </button>
        <h1 className="text-3xl font-display font-black text-white">Sign Up</h1>
        <p className="text-gray-400 text-sm mt-1">Gobike အကောင့်ဖွင့်မည်</p>
      </div>

      <div className="flex-1 px-6 py-6 overflow-y-auto pb-10">

        {/* Role selector */}
        <div className="mb-6">
          <p className="text-xs font-bold text-gray-500 mb-3 uppercase tracking-widest">အကောင့်အမျိုးအစား</p>
          <div className="grid grid-cols-2 gap-3">
            {[
              { value:"customer", icon:"🛍️", label:"Customer",  sub:"Order ပို့မည်" },
              { value:"rider",    icon:"🏍️", label:"Rider",     sub:"Delivery လုပ်မည်" },
            ].map(r => (
              <button key={r.value} type="button"
                onClick={() => { setRole(r.value); setStep(1); setError("") }}
                className={`py-4 rounded-2xl flex flex-col items-center gap-1 border-2 transition-all
                  ${role===r.value
                    ? "border-primary-500 bg-primary-500 text-white shadow-primary"
                    : "border-gray-200 bg-white text-gray-600"}`}>
                <span className="text-2xl">{r.icon}</span>
                <span className="text-sm font-bold">{r.label}</span>
                <span className={`text-[10px] ${role===r.value ? "text-primary-100" : "text-gray-400"}`}>{r.sub}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Rider step indicator */}
        {role === "rider" && (
          <div className="flex items-center mb-5">
            {[1,2].map(s => (
              <div key={s} className="flex items-center flex-1">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black border-2 transition-all
                  ${step >= s ? "bg-primary-500 border-primary-500 text-white" : "bg-white border-gray-200 text-gray-400"}`}>
                  {step > s ? "✓" : s}
                </div>
                {s < 2 && <div className={`flex-1 h-1 mx-1 rounded transition-all ${step > s ? "bg-primary-500" : "bg-gray-200"}`} />}
              </div>
            ))}
            <span className="text-xs text-gray-400 ml-3">
              {step === 1 ? "အချက်အလက်" : "ယဉ်အချက်အလက်"}
            </span>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-xs px-4 py-3 rounded-2xl mb-4 flex items-center gap-2">
            ⚠️ {error}
          </div>
        )}

        {/* ── Step 1 : Basic info (both roles) ── */}
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-gray-500 mb-1.5 block uppercase tracking-widest">👤 အမည်</label>
              <input value={name} onChange={e => setName(e.target.value)}
                placeholder="ဥပမာ - မမသက်"
                className="w-full bg-gray-50 border-2 border-gray-200 rounded-2xl px-4 py-3 text-sm font-semibold focus:outline-none focus:border-primary-400 focus:bg-white transition-all" />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 mb-1.5 block uppercase tracking-widest">✉️ Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="example@gmail.com"
                className="w-full bg-gray-50 border-2 border-gray-200 rounded-2xl px-4 py-3 text-sm font-semibold focus:outline-none focus:border-primary-400 focus:bg-white transition-all" />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 mb-1.5 block uppercase tracking-widest">📞 ဖုန်းနံပါတ်</label>
              <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                placeholder="09xxxxxxxx"
                className="w-full bg-gray-50 border-2 border-gray-200 rounded-2xl px-4 py-3 text-sm font-semibold focus:outline-none focus:border-primary-400 focus:bg-white transition-all" />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 mb-1.5 block uppercase tracking-widest">🔒 Password</label>
              <div className="relative">
                <input type={showPw ? "text" : "password"} value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="အနည်းဆုံး ၆ လုံး"
                  className="w-full bg-gray-50 border-2 border-gray-200 rounded-2xl px-4 py-3 pr-12 text-sm font-semibold focus:outline-none focus:border-primary-400 focus:bg-white transition-all" />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                  {showPw ? "🙈" : "👁️"}
                </button>
              </div>
              {password && password.length < 6 && (
                <p className="text-xs text-red-400 mt-1">Password အနည်းဆုံး ၆ လုံး ထည့်ပါ</p>
              )}
            </div>

            {/* Customer → direct submit | Rider → go step 2 */}
            {role === "customer" ? (
              <button onClick={handleSubmit} disabled={loading || !basicValid}
                className="btn-primary mt-2 disabled:opacity-40">
                {loading ? "လုပ်ဆောင်နေသည်..." : "အကောင့်ဖွင့်မည် 🚀"}
              </button>
            ) : (
              <button onClick={() => { setError(""); setStep(2) }}
                disabled={!basicValid}
                className="btn-primary mt-2 disabled:opacity-40">
                ဆက်လက်မည် →
              </button>
            )}
          </div>
        )}

        {/* ── Step 2 : Rider vehicle info ── */}
        {step === 2 && role === "rider" && (
          <div className="space-y-4">

            {/* Vehicle type */}
            <div>
              <label className="text-xs font-bold text-gray-500 mb-2 block uppercase tracking-widest">🏍️ ယဉ်အမျိုးအစား</label>
              <div className="grid grid-cols-2 gap-2">
                {VEHICLE_TYPES.map(v => (
                  <button key={v.value} type="button" onClick={() => setVehicleType(v.value)}
                    className={`py-3 px-3 rounded-2xl text-xs font-semibold text-left border-2 transition-all
                      ${vehicleType===v.value ? "border-primary-500 bg-primary-50 text-primary-600" : "border-gray-200 bg-white text-gray-600"}`}>
                    {v.label}
                  </button>
                ))}
              </div>
            </div>

            {/* License plate */}
            <div>
              <label className="text-xs font-bold text-gray-500 mb-1.5 block uppercase tracking-widest">🔢 License Plate</label>
              <input value={licensePlate} onChange={e => setLicensePlate(e.target.value.toUpperCase())}
                placeholder="ဥပမာ - ရန် ၁၂၃၄ / 1A-1234"
                className="w-full bg-gray-50 border-2 border-gray-200 rounded-2xl px-4 py-3 text-sm font-semibold focus:outline-none focus:border-primary-400 focus:bg-white transition-all" />
            </div>

            {/* NRC */}
            <div>
              <label className="text-xs font-bold text-gray-500 mb-1.5 block uppercase tracking-widest">🪪 NRC နံပါတ်</label>
              <input value={nrc} onChange={e => setNrc(e.target.value)}
                placeholder="ဥပမာ - ၁၂/ဥကတ(နိုင်)၁၂၃၄၅၆"
                className="w-full bg-gray-50 border-2 border-gray-200 rounded-2xl px-4 py-3 text-sm font-semibold focus:outline-none focus:border-primary-400 focus:bg-white transition-all" />
            </div>

            {/* Address */}
            <div>
              <label className="text-xs font-bold text-gray-500 mb-1.5 block uppercase tracking-widest">📍 နေရပ်လိပ်စာ</label>
              <textarea value={address} onChange={e => setAddress(e.target.value)}
                rows={3} placeholder="မြို့နယ်၊ ရပ်ကွက်၊ လမ်း၊ အိမ်နံပါတ်"
                className="w-full bg-gray-50 border-2 border-gray-200 rounded-2xl px-4 py-3 text-sm font-semibold focus:outline-none focus:border-primary-400 focus:bg-white transition-all resize-none" />
            </div>

            {/* Notice */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-2xl px-4 py-3 flex items-start gap-2">
              <span className="text-base shrink-0">⏳</span>
              <div>
                <p className="text-xs font-bold text-yellow-700">Admin Approve လုပ်ရမည်</p>
                <p className="text-xs text-yellow-600 mt-0.5">Sign up ပြီးနောက် Admin က approve မလုပ်မချင်း app သုံးမရသေးပါ</p>
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep(1)}
                className="flex-1 py-4 rounded-2xl border-2 border-gray-200 font-bold text-gray-500 text-sm">
                ← ပြန်
              </button>
              <button onClick={handleSubmit}
                disabled={loading || !vehicleType || !licensePlate || !nrc || !address}
                className="flex-[2] btn-primary disabled:opacity-40">
                {loading ? "လုပ်ဆောင်နေသည်..." : "လျှောက်ထားမည် 🚀"}
              </button>
            </div>
          </div>
        )}

        <p className="text-center text-xs text-gray-500 mt-6">
          အကောင့်ရှိပြီးသား?{" "}
          <button onClick={() => navigate("/login")} className="text-primary-500 font-semibold">
            Login ဝင်မည်
          </button>
        </p>
      </div>
    </div>
  )
}
