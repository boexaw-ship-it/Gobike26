// src/pages/auth/AdminLogin.jsx
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { signInWithEmailAndPassword } from "firebase/auth"
import { doc, getDoc } from "firebase/firestore"
import { auth, db } from "../../firebase/config"

export default function AdminLogin() {
  const [form, setForm] = useState({ email: "", password: "" })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const navigate = useNavigate()

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    try {
      const { user } = await signInWithEmailAndPassword(auth, form.email, form.password)
      const snap = await getDoc(doc(db, "users", user.uid))
      const role = snap.data()?.role
      if (role === "admin") {
        navigate("/admin")
      } else {
        setError("Admin အကောင့် မဟုတ်ပါ")
        await auth.signOut()
      }
    } catch (err) {
      setError("Email သို့မဟုတ် Password မှားနေသည်")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-dark flex flex-col items-center justify-center px-6 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500 rounded-full opacity-10 blur-3xl -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-primary-400 rounded-full opacity-10 blur-3xl translate-y-1/2 -translate-x-1/2" />

      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-primary-500 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-primary">
          <span className="text-3xl">⚙️</span>
        </div>
        <h1 className="text-2xl font-display font-black text-white">Admin Portal</h1>
        <p className="text-gray-500 text-xs mt-1">Gobike Management System</p>
      </div>

      <div className="w-full max-w-sm">
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-xs px-4 py-3 rounded-2xl mb-4">
            ⚠️ {error}
          </div>
        )}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1 block">Admin Email</label>
            <input
              type="email"
              placeholder="admin@gobike.mm"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-primary-500 transition-all"
              required
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1 block">Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-primary-500 transition-all"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary-500 text-white font-display font-bold py-4 rounded-2xl shadow-primary active:scale-95 transition-all disabled:opacity-50 mt-2"
          >
            {loading ? "ဝင်ရောက်နေသည်..." : "🔐 Admin Login"}
          </button>
        </form>

        <p className="text-center text-xs text-gray-600 mt-6">
          Gobike Admin Panel · Authorized Access Only
        </p>

        <p className="text-center mt-3">
          <button onClick={() => navigate("/login")} className="text-gray-600 text-[10px]">
            ← Back to Login
          </button>
        </p>
      </div>
    </div>
  )
}
