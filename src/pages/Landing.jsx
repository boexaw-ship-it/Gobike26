// src/pages/Landing.jsx
import { useNavigate } from "react-router-dom"

export default function Landing() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-dark flex flex-col overflow-hidden relative">

      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-72 h-72 bg-primary-500 rounded-full opacity-10 blur-3xl -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-56 h-56 bg-primary-400 rounded-full opacity-10 blur-3xl translate-y-1/2 -translate-x-1/2" />

      {/* Hero */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center pt-16 pb-8">

        {/* Logo */}
        <div className="relative mb-8">
          <div className="w-24 h-24 bg-primary-500 rounded-3xl flex items-center justify-center shadow-primary mb-4">
            <span className="text-5xl">🚴</span>
          </div>
          <div className="absolute -top-2 -right-2 w-6 h-6 bg-primary-300 rounded-full opacity-60 animate-ping-slow" />
        </div>

        <h1 className="text-5xl font-display font-black text-white mb-2 tracking-tight">
          Go<span className="text-primary-500">bike</span>
        </h1>
        <p className="text-gray-400 text-sm font-body mb-2">
          Myanmar's Fast Delivery Service
        </p>
        <p className="text-gray-500 text-xs font-body">
          မြန်မြန်ဆန်ဆန် • ယုံကြည်ရ • တိုက်ရိုက်ခြေရာခံ
        </p>

        {/* Stats */}
        <div className="flex gap-8 mt-10 mb-10">
          {[
            { value: "500+", label: "Riders" },
            { value: "10K+", label: "Deliveries" },
            { value: "4.8★", label: "Rating" },
          ].map(stat => (
            <div key={stat.label} className="text-center">
              <p className="text-2xl font-display font-black text-primary-400">{stat.value}</p>
              <p className="text-xs text-gray-500 font-body">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Features */}
        <div className="grid grid-cols-2 gap-3 w-full max-w-xs mb-10">
          {[
            { icon: "📍", text: "Real-time Tracking" },
            { icon: "⚡", text: "Fast Delivery" },
            { icon: "🔒", text: "Secure Payment" },
            { icon: "💬", text: "24/7 Support" },
          ].map(f => (
            <div key={f.text} className="bg-white/5 rounded-2xl p-3 flex items-center gap-2">
              <span className="text-lg">{f.icon}</span>
              <span className="text-xs text-gray-300 font-body">{f.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="px-6 pb-10 space-y-3">
        <button
          onClick={() => navigate("/signup")}
          className="w-full bg-primary-500 text-white font-display font-bold py-4 rounded-2xl shadow-primary text-base active:scale-95 transition-all"
        >
          အကောင့်ဖွင့်မည် →
        </button>
        <button
          onClick={() => navigate("/login")}
          className="w-full bg-white/10 text-white font-display font-semibold py-4 rounded-2xl text-base active:scale-95 transition-all"
        >
          Login ဝင်မည်
        </button>
        <p className="text-center text-xs text-gray-600 font-body">
          Gobike © 2024 · Myanmar
        </p>
      </div>
    </div>
  )
}
