// src/pages/auth/Login.jsx
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../../context/AuthContext"

export default function Login() {
  const [selectedRole, setSelectedRole] = useState("customer")
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const roles = [
    { value: "customer", icon: "🛍️", label: "Customer", desc: "ပစ္စည်းမှာမည်" },
    { value: "rider",    icon: "🏍️", label: "Rider",    desc: "ပို့ဆောင်မည်" },
    { value: "admin",    icon: "⚙️",  label: "Admin",    desc: "စီမံမည်" },
  ]

  const handleLogin = (e) => {
    e.preventDefault()
    setLoading(true)
    setTimeout(() => {
      login(selectedRole)
      navigate(`/${selectedRole}`)
    }, 800)
  }

  return (
    <div className="min-h-screen bg-surface flex flex-col">

      {/* Header */}
      <div className="bg-dark px-6 pt-12 pb-8 relative overflow-hidden">
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-primary-500 rounded-full opacity-10 blur-2xl translate-y-1/2 -translate-x-1/2" />
        <button onClick={() => navigate("/")} className="text-gray-400 text-sm mb-4 block">← Back</button>
        <h1 className="text-3xl font-display font-black text-white">Welcome Back 👋</h1>
        <p className="text-gray-400 text-sm font-body mt-1">Gobike မှ ကြိုဆိုပါသည်</p>
      </div>

      <div className="flex-1 px-6 py-6">

        {/* Quick Role Login (demo) */}
        <div className="mb-6">
          <p className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wider">Role ရွေးပြီး Login</p>
          <div className="space-y-2">
            {roles.map(r => (
              <button
                key={r.value}
                onClick={() => setSelectedRole(r.value)}
                className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all
                  ${selectedRole === r.value
                    ? "border-primary-500 bg-primary-50"
                    : "border-gray-200 bg-white"
                  }`}
              >
                <span className="text-2xl">{r.icon}</span>
                <div className="text-left">
                  <p className={`text-sm font-display font-bold ${selectedRole === r.value ? "text-primary-600" : "text-gray-700"}`}>
                    {r.label}
                  </p>
                  <p className="text-xs text-gray-400 font-body">{r.desc}</p>
                </div>
                {selectedRole === r.value && (
                  <span className="ml-auto text-primary-500">✓</span>
                )}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1 block">Email</label>
            <input type="email" defaultValue="demo@gobike.mm" className="input-field" />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1 block">Password</label>
            <input type="password" defaultValue="123456" className="input-field" />
          </div>

          <button type="submit" disabled={loading} className="btn-primary mt-2">
            {loading ? "ဝင်ရောက်နေသည်..." : `${roles.find(r=>r.value===selectedRole)?.icon} ${selectedRole} အဖြစ် Login ဝင်မည်`}
          </button>
        </form>

        <p className="text-center text-xs text-gray-500 mt-6 font-body">
          အကောင့်မရှိသေးဘူးလား?{" "}
          <button onClick={() => navigate("/signup")} className="text-primary-500 font-semibold">
            Sign Up လုပ်မည်
          </button>
        </p>
      </div>
    </div>
  )
}
