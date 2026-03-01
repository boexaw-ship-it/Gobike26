// src/pages/auth/Login.jsx
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { signInWithEmailAndPassword } from "firebase/auth"
import { doc, getDoc } from "firebase/firestore"
import { auth, db } from "../../firebase/config"

export default function Login() {
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
      if (role === "customer") navigate("/customer")
      else if (role === "rider") navigate("/rider")
      else if (role === "admin") navigate("/admin")
      else navigate("/")
    } catch (err) {
      setError("Email သို့မဟုတ် Password မှားနေသည်")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <div className="bg-dark px-6 pt-12 pb-8 relative overflow-hidden">
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-primary-500 rounded-full opacity-10 blur-2xl translate-y-1/2 -translate-x-1/2" />
        <button onClick={() => navigate("/")} className="text-gray-400 text-sm mb-4 block">← Back</button>
        <h1 className="text-3xl font-display font-black text-white">Welcome Back 👋</h1>
        <p className="text-gray-400 text-sm font-body mt-1">Gobike မှ ကြိုဆိုပါသည်</p>
      </div>
      <div className="flex-1 px-6 py-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-xs px-4 py-3 rounded-2xl mb-4">
            ⚠️ {error}
          </div>
        )}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1 block">Email</label>
            <input type="email" placeholder="example@gmail.com" value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              className="input-field" required />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1 block">Password</label>
            <input type="password" placeholder="••••••••" value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              className="input-field" required />
          </div>
          <button type="submit" disabled={loading} className="btn-primary mt-2">
            {loading ? "ဝင်ရောက်နေသည်..." : "Login ဝင်မည်"}
          </button>
        </form>

        <p className="text-center text-xs text-gray-500 mt-6">
          အကောင့်မရှိသေးဘူးလား?{" "}
          <button onClick={() => navigate("/signup")} className="text-primary-500 font-semibold">
            Sign Up လုပ်မည်
          </button>
        </p>

        <p className="text-center mt-4">
          <button onClick={() => navigate("/gobike-admin-2024")} className="text-gray-400 text-[10px]">
            ⚙️ Admin
          </button>
        </p>
      </div>
    </div>
  )
}
