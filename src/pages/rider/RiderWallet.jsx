// src/pages/rider/RiderWallet.jsx
import { useState, useEffect } from "react"
import { useAuth } from "../../context/AuthContext"
import Navbar from "../../components/common/Navbar"
import BottomNav from "../../components/common/BottomNav"
import { listenToRiderBalance, listenToTransactions } from "../../services/walletService"

function TxDetailModal({ tx, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
      <div className="bg-white w-full rounded-t-3xl px-6 py-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-display font-black text-dark">Transaction Details</h3>
          <button onClick={onClose} className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">✕</button>
        </div>
        <div className="space-y-3">
          <div className="text-center py-3">
            <span className="text-5xl">{tx.type === "topup" ? "💰" : "📦"}</span>
            <p className={`text-2xl font-display font-black mt-2 ${tx.type === "topup" ? "text-green-500" : "text-primary-500"}`}>
              {tx.type === "topup" ? "+" : ""}{tx.amount?.toLocaleString()} ကျပ်
            </p>
          </div>
          <div className="bg-gray-50 rounded-2xl p-4 space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-gray-400">အမျိုးအစား</span>
              <span className="font-semibold">{tx.type === "topup" ? "💰 Top-up" : "📦 Delivery"}</span>
            </div>
            {tx.type === "commission" && (
              <>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">Delivery Fee</span>
                  <span className="font-semibold">{tx.amount?.toLocaleString()} ကျပ်</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">Commission (10%)</span>
                  <span className="text-red-500 font-semibold">- {tx.commission?.toLocaleString()} ကျပ်</span>
                </div>
                <div className="flex justify-between text-xs border-t pt-2">
                  <span className="font-bold text-gray-700">ရရှိသည်</span>
                  <span className="font-bold text-green-600">{tx.netAmount?.toLocaleString()} ကျပ်</span>
                </div>
              </>
            )}
            <div className="flex justify-between text-xs border-t pt-2">
              <span className="text-gray-400">မှတ်ချက်</span>
              <span className="font-semibold text-right max-w-[60%]">{tx.note}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-400">Coin လက်ကျန်</span>
              <span className="font-semibold">{tx.balanceAfter?.toLocaleString()} ကျပ်</span>
            </div>
          </div>
        </div>
        <button onClick={onClose} className="btn-primary mt-4">ပိတ်မည်</button>
      </div>
    </div>
  )
}

export default function RiderWallet() {
  const { user } = useAuth()
  const [wallet, setWallet] = useState({ coinBalance: 0, totalEarned: 0, totalCommission: 0, isLowBalance: false })
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedTx, setSelectedTx] = useState(null)

  useEffect(() => {
    if (!user) return
    const unsubBalance = listenToRiderBalance(user.uid, (data) => {
      setWallet(data)
      setLoading(false)
    })
    const unsubTx = listenToTransactions(user.uid, setTransactions)
    return () => { unsubBalance(); unsubTx() }
  }, [user])

  const timeAgo = (ts) => {
    if (!ts) return ""
    const d = ts.toDate ? ts.toDate() : new Date(ts)
    const diff = Math.floor((Date.now() - d) / 1000)
    if (diff < 60) return "ခုနက"
    if (diff < 3600) return `${Math.floor(diff/60)} မိနစ်က`
    if (diff < 86400) return `${Math.floor(diff/3600)} နာရီက`
    return `${Math.floor(diff/86400)} ရက်က`
  }

  return (
    <div className="flex flex-col h-screen bg-surface">
      <Navbar title="Wallet" />
      <div className="flex-1 overflow-y-auto pb-24">

        {wallet.isLowBalance && (
          <div className="mx-4 mt-4 bg-red-50 border border-red-200 rounded-2xl p-3 flex items-center gap-2">
            <span className="text-xl">⚠️</span>
            <div>
              <p className="text-xs font-bold text-red-600">Coin နည်းနေပြီ!</p>
              <p className="text-xs text-red-400">Admin ကို coin ဖြည့်ပေးဖို့ ပြောပါ</p>
            </div>
          </div>
        )}

        {/* Balance Card */}
        <div className="px-4 mt-4">
          <div className="bg-dark rounded-3xl p-5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500 rounded-full opacity-10 blur-2xl -translate-y-1/2 translate-x-1/2" />
            <p className="text-gray-400 text-xs mb-1">🪙 လက်ကျန် Coin</p>
            <p className="text-4xl font-display font-black text-white">
              {wallet.coinBalance.toLocaleString()}
              <span className="text-primary-400 text-lg ml-1">ကျပ်</span>
            </p>
            <div className="flex gap-4 mt-4 pt-4 border-t border-white/10">
              <div>
                <p className="text-xs text-gray-400">စုစုပေါင်း ရငွေ</p>
                <p className="text-sm font-display font-bold text-green-400">+{wallet.totalEarned.toLocaleString()} ကျပ်</p>
              </div>
              <div className="w-px bg-white/10" />
              <div>
                <p className="text-xs text-gray-400">Commission နုတ်</p>
                <p className="text-sm font-display font-bold text-red-400">-{wallet.totalCommission.toLocaleString()} ကျပ်</p>
              </div>
            </div>
          </div>
        </div>

        {/* Commission Info */}
        <div className="px-4 mt-3">
          <div className="card flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-100 rounded-2xl flex items-center justify-center text-xl">📊</div>
            <div>
              <p className="text-sm font-display font-bold text-dark">Commission Rate</p>
              <p className="text-xs text-gray-400">Delivery တစ်ခုလျှင် <span className="text-primary-500 font-bold">10%</span> Coin ကနေ နုတ်သည်</p>
            </div>
          </div>
        </div>

        {/* Transaction History */}
        <div className="px-4 mt-3">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Transaction History</p>
          {loading ? (
            <div className="text-center py-8">
              <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto" />
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-3xl mb-2">📋</p>
              <p className="text-gray-400 text-sm">Transaction မရှိသေးပါ</p>
            </div>
          ) : (
            <div className="space-y-2">
              {transactions.map(tx => (
                <div key={tx.id} className="card cursor-pointer active:scale-[0.98] transition-all"
                  onClick={() => setSelectedTx(tx)}>
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-xl
                      ${tx.type === "topup" ? "bg-green-100" : "bg-orange-100"}`}>
                      {tx.type === "topup" ? "💰" : "📦"}
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-dark">{tx.note}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">{timeAgo(tx.createdAt)}</p>
                    </div>
                    <div className="text-right">
                      {tx.type === "topup" ? (
                        <p className="text-sm font-display font-black text-green-500">+{tx.amount?.toLocaleString()}</p>
                      ) : (
                        <div>
                          <p className="text-xs font-bold text-green-600">+{tx.netAmount?.toLocaleString()}</p>
                          <p className="text-[10px] text-red-400">-{tx.commission?.toLocaleString()} coin</p>
                        </div>
                      )}
                    </div>
                    <span className="text-gray-300 text-xs">→</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <BottomNav />
      {selectedTx && <TxDetailModal tx={selectedTx} onClose={() => setSelectedTx(null)} />}
    </div>
  )
}
