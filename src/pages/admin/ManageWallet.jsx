// src/pages/admin/ManageWallet.jsx
import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { collection, onSnapshot, doc, updateDoc, addDoc, serverTimestamp } from "firebase/firestore"
import { db } from "../../firebase/config"
import Toast from "../../components/common/Toast"

async function sendTelegram(text) {
  const BOT  = import.meta.env.VITE_TELEGRAM_BOT_TOKEN
  const CHAT = import.meta.env.VITE_TELEGRAM_ADMIN_CHAT_ID
  if (!BOT || !CHAT) return
  await fetch(`https://api.telegram.org/bot${BOT}/sendMessage`, {
    method:"POST", headers:{"Content-Type":"application/json"},
    body: JSON.stringify({ chat_id:CHAT, text, parse_mode:"HTML" }),
  }).catch(()=>{})
}

const QUICK_AMOUNTS = [5000, 10000, 20000, 50000]

export default function ManageWallet() {
  const navigate = useNavigate()
  const [riders, setRiders]           = useState([])
  const [selected, setSelected]       = useState(null)
  const [amount, setAmount]           = useState("")
  const [note, setNote]               = useState("")
  const [loading, setLoading]         = useState(false)
  const [toast, setToast]             = useState(null)
  const [filter, setFilter]           = useState("all")

  const showToast = (msg, type="success") => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  useEffect(() => {
    return onSnapshot(collection(db,"riders"), snap => {
      setRiders(snap.docs.map(d => ({ id:d.id, ...d.data() })))
    })
  }, [])

  const handleTopUp = async () => {
    if (!selected || !amount) return
    const amt = parseInt(amount)
    setLoading(true)
    try {
      const newBalance = (selected.coinBalance || 0) + amt
      await updateDoc(doc(db,"riders", selected.id), {
        coinBalance: newBalance,
        updatedAt: serverTimestamp(),
      })
      // Log to walletTransactions
      await addDoc(collection(db,"walletTransactions"), {
        riderId: selected.id,
        riderName: selected.name,
        type: "topup",
        amount: amt,
        balanceBefore: selected.coinBalance || 0,
        balanceAfter: newBalance,
        note: note || "Admin topup",
        createdAt: serverTimestamp(),
        by: "admin",
      })
      await sendTelegram(
        `💰 <b>Coin ဖြည့်ပြီ!</b>\n🏍️ <b>${selected.name}</b>\n📞 ${selected.phone}\n\n💎 ဖြည့်သည်: ${amt.toLocaleString()} ကျပ်\n🪙 လက်ကျန်: ${newBalance.toLocaleString()} ကျပ်\n${note ? `📝 ${note}` : ""}`
      )
      showToast(`${selected.name} ကို ${amt.toLocaleString()} ကျပ် ဖြည့်ပြီ ✅`)
      setSelected(null); setAmount(""); setNote("")
    } catch { showToast("Error ဖြစ်သည်", "error") }
    finally { setLoading(false) }
  }

  const filtered = {
    all:  riders,
    low:  riders.filter(r => (r.coinBalance||0) < 1000),
    online: riders.filter(r => r.isOnline),
  }[filter] || riders

  const totalCoins = riders.reduce((s,r) => s + (r.coinBalance||0), 0)
  const lowCount   = riders.filter(r => (r.coinBalance||0) < 1000).length

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {toast && <Toast message={toast.msg} type={toast.type} />}

      {/* Header */}
      <div className="bg-dark px-4 pt-10 pb-4 sticky top-0 z-40">
        <div className="flex items-center gap-3 mb-1">
          <button onClick={() => navigate("/admin")} className="text-gray-400 text-sm">← ပြန်</button>
          <h1 className="text-white font-display font-black">💰 Wallet Management</h1>
        </div>
        <p className="text-gray-500 text-xs">Rider Coin ဖြည့်သည်</p>
      </div>

      <div className="flex-1 overflow-y-auto pb-6">
        {/* Summary */}
        <div className="px-4 pt-4 grid grid-cols-3 gap-2 mb-4">
          <div className="bg-white rounded-2xl p-3 text-center shadow-sm">
            <p className="font-black text-lg text-dark">{riders.length}</p>
            <p className="text-[10px] text-gray-400">Total Riders</p>
          </div>
          <div className={`rounded-2xl p-3 text-center shadow-sm ${lowCount > 0 ? "bg-red-50 border border-red-200" : "bg-white"}`}>
            <p className={`font-black text-lg ${lowCount > 0 ? "text-red-500" : "text-dark"}`}>{lowCount}</p>
            <p className="text-[10px] text-gray-400">⚠️ Low Balance</p>
          </div>
          <div className="bg-white rounded-2xl p-3 text-center shadow-sm">
            <p className="font-black text-sm text-primary-500">{totalCoins.toLocaleString()}</p>
            <p className="text-[10px] text-gray-400">Total Coins</p>
          </div>
        </div>

        {/* Filter */}
        <div className="px-4 flex gap-2 mb-3">
          {[["all","အားလုံး"],["low","⚠️ Low"],["online","🟢 Online"]].map(([v,l]) => (
            <button key={v} onClick={() => setFilter(v)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all
                ${filter===v ? "bg-primary-500 text-white" : "bg-white text-gray-500 border border-gray-200"}`}>
              {l}
            </button>
          ))}
        </div>

        {/* Riders list */}
        <div className="px-4 space-y-3">
          {filtered.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-400 text-sm">Rider မရှိပါ</p>
            </div>
          ) : filtered.map(rider => {
            const isLow = (rider.coinBalance||0) < 1000
            return (
              <div key={rider.id}
                className={`bg-white rounded-2xl p-4 shadow-sm border-2 ${isLow ? "border-red-200" : "border-transparent"}`}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="relative">
                    <div className="w-10 h-10 bg-primary-100 rounded-2xl flex items-center justify-center font-black text-primary-600">
                      {rider.name?.charAt(0)}
                    </div>
                    {isLow && (
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                        <span className="text-[8px] text-white font-bold">!</span>
                      </div>
                    )}
                    <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${rider.isOnline ? "bg-green-500" : "bg-gray-300"}`} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-dark">{rider.name}</p>
                    <p className="text-xs text-gray-400">{rider.phone}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-lg font-display font-black ${isLow ? "text-red-500" : "text-dark"}`}>
                      {Number(rider.coinBalance||0).toLocaleString()}
                    </p>
                    <p className="text-[10px] text-gray-400">ကျပ်</p>
                  </div>
                </div>
                <div className="flex justify-between text-xs text-gray-400 mb-3">
                  <span>📦 {rider.totalDeliveries||0} deliveries</span>
                  <span>💰 ရငွေ: {Number(rider.totalEarned||0).toLocaleString()}</span>
                  <span>📊 {Number(rider.totalCommission||0).toLocaleString()}</span>
                </div>
                <button onClick={() => setSelected(rider)}
                  className={`w-full py-2.5 rounded-2xl text-xs font-bold
                    ${isLow ? "bg-red-500 text-white" : "bg-primary-500 text-white shadow-primary"}`}>
                  💰 Coin ဖြည့်မည်
                </button>
              </div>
            )
          })}
        </div>
      </div>

      {/* TopUp Modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end">
          <div className="bg-white w-full rounded-t-3xl px-5 py-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-xs text-gray-400">Coin ဖြည့်မည်</p>
                <p className="font-display font-black text-xl text-dark">{selected.name}</p>
                <p className="text-xs text-gray-400">
                  လက်ကျန်: <span className="font-bold text-primary-500">{Number(selected.coinBalance||0).toLocaleString()} ကျပ်</span>
                </p>
              </div>
              <button onClick={() => { setSelected(null); setAmount(""); setNote("") }}
                className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-500">✕</button>
            </div>

            <div className="grid grid-cols-4 gap-2 mb-4">
              {QUICK_AMOUNTS.map(a => (
                <button key={a} onClick={() => setAmount(String(a))}
                  className={`py-2 rounded-xl text-xs font-bold border-2 transition-all
                    ${amount===String(a) ? "border-primary-500 bg-primary-500 text-white" : "border-gray-200 text-gray-600"}`}>
                  {(a/1000).toFixed(0)}K
                </button>
              ))}
            </div>

            <input type="number" placeholder="Amount (ကျပ်)" value={amount}
              onChange={e => setAmount(e.target.value)}
              className="w-full bg-gray-50 border-2 border-gray-200 rounded-2xl px-4 py-3 text-sm font-semibold focus:outline-none focus:border-primary-400 transition-all mb-3" />
            <input type="text" placeholder="မှတ်ချက် (optional)" value={note}
              onChange={e => setNote(e.target.value)}
              className="w-full bg-gray-50 border-2 border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-primary-400 transition-all mb-4" />

            {amount && parseInt(amount) > 0 && (
              <div className="bg-green-50 border border-green-200 rounded-2xl p-3 mb-4 text-center">
                <p className="text-xs text-gray-400">ဖြည့်ပြီးရင် လက်ကျန်</p>
                <p className="text-2xl font-display font-black text-green-600">
                  {((selected.coinBalance||0) + parseInt(amount||0)).toLocaleString()} ကျပ်
                </p>
              </div>
            )}

            <button onClick={handleTopUp}
              disabled={!amount || parseInt(amount) <= 0 || loading}
              className="w-full bg-primary-500 text-white font-bold py-4 rounded-2xl shadow-primary disabled:opacity-40 active:scale-95 transition-all">
              {loading ? "လုပ်ဆောင်နေသည်..." : `💰 ${parseInt(amount||0).toLocaleString()} ကျပ် ဖြည့်မည်`}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
