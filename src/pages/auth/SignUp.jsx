// src/pages/auth/SignUp.jsx
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../../context/AuthContext"

export default function SignUp() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "", role: "customer" })
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const roles = [
    { value: "customer", icon: "🛍️", label: "Customer" },
    { value: "rider",    icon: "🏍️", label: "Rider" },
    { value: "admin",    icon: "⚙️",  label: "Admin" },
  ]

  const handleSubmit = (e) => {
    e.preventDefault()
    setLoading(true)
    setTimeout(() => {
      login(form.role)
      navigate(`/${form.role}`)
    }, 1000)
  }

  return (
    <div className="min-h-screen bg-surface flex flex-col">

      {/* Header */}
      <div className="bg-dark px-6 pt-12 pb-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-primary-500 rounded-full opacity-15 blur-2xl -translate-y-1/2 translate-x-1/2" />
        <button onClick={() => navigate("/")} className="text-gray-400 text-sm mb-4 block">← Back</button>
        <h1 className="text-3xl font-display font-black text-white">Sign Up</h1>
        <p className="text-gray-400 text-sm font-body mt-1">Gobike အကောင့်ဖွင့်မည်</p>
      </div>

      {/* Form */}
      <div className="flex-1 px-6 py-6 overflow-y-auto">

        {/* Role Select */}
        <div className="mb-6">
          <p className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wider">အကောင့်အမျိုးအစား</p>
          <div className="grid grid-cols-3 gap-2">
            {roles.map(r => (
              <button
                key={r.value}
                type="button"
                onClick={() => setForm({ ...form, role: r.value })}
                className={`py-3 rounded-2xl flex flex-col items-center gap-1 border-2 transition-all
                  ${form.role === r.value
                    ? "border-primary-500 bg-primary-500 text-white shadow-primary"
                    : "border-gray-200 bg-white text-gray-600"
                  }`}
              >
                <span className="text-xl">{r.icon}</span>
                <span className="text-xs font-semibold font-body">{r.label}</span>
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1 block">အမည်</label>
            <input
              type="text"
              placeholder="ဥပမာ - မမသက်"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              className="input-field"
              required
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1 block">Email</label>
            <input
              type="email"
              placeholder="example@gmail.com"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              className="input-field"
              required
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1 block">ဖုန်းနံပါတ်</label>
            <input
              type="tel"
              placeholder="09xxxxxxxx"
              value={form.phone}
              onChange={e => setForm({ ...form, phone: e.target.value })}
              className="input-field"
              required
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1 block">Password</label>
            <input
              type="password"
              placeholder="အနည်းဆုံး ၆ လုံး"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              className="input-field"
              required
              minLength={6}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary mt-2"
          >
            {loading ? "လုပ်ဆောင်နေသည်..." : "အကောင့်ဖွင့်မည် 🚀"}
          </button>
        </form>

        <p className="text-center text-xs text-gray-500 mt-6 font-body">
          အကောင့်ရှိပြီးသား?{" "}
          <button onClick={() => navigate("/login")} className="text-primary-500 font-semibold">
            Login ဝင်မည်
          </button>
        </p>
      </div>
    </div>
  )
}
