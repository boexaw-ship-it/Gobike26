// src/pages/admin/ManageWallet.jsx
import { useState } from "react"
import Navbar from "../../components/common/Navbar"
import BottomNav from "../../components/common/BottomNav"
import { mockRiders } from "../../data/mockRiders"
import { adminTopUp } from "../../services/walletService"

const mockRidersWithWallet = mockRiders.map((r, i) => ({
  ...r,
  coinBalance:     [4150, 850, 12000][i],
  totalEarned:     [25000, 8000, 45000][i],
  totalCommission: [2500, 800, 4500][i],
  isLowBalance:    [false, true, false][i],
}))

export default function ManageWallet() {
  const [riders, setRiders] = useState(mockRidersWithWallet)
  const [selectedRider, setSelectedRider] = useState(null)
  const [topUpAmount, setTopUpAmount] = useState("")
  const [note, setNote] = useState("")
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState("")

  const quickAmounts = [5000, 10000, 20000, 50000]

  const handleTopUp = async () => {
    if (!selectedRider || !topUpAmount) return
    setLoading(true)

    // Mock top-up (Firebase connect လုပ်ပြီးရင် uncomment)
    // await adminTopUp(selectedRider.id, parseInt(topUpAmount), note)

    setTimeout(() => {
      setRiders(prev => prev.map(r =>
        r.id === selectedRider.id
          ? { ...r, coinBalance: r.coinBalance + parseInt(topUpAmount), isLowBalance: false }
          : r
      ))
      setSuccess(`${selectedRider.name} ကို ${parseInt(topUpAmount).toLocaleString()} ကျပ် ဖြည့်ပြီ`)
      setSelectedRider(null)
      setTopUpAmount("")
      setNote("")
      setLoading(false)
      setTimeout(() => setSuccess(""), 3000)
    }, 800)
  }

  return (
    <div className="flex flex-col h-screen bg-surface">
      <Navbar title="Wallet Management" />

      <div className="flex-1 overflow-y-auto pb-24">

        {/* Success Toast */}
        {success && (
          <div className="mx-4 mt-4 bg-green-50 border border-green-200 rounded-2xl p-3 flex items-center gap-2 animate-slide-up">
            <span>✅</span>
            <p className="text-xs font-bold text-green-600">{success}</p>
          </div>
        )}

        {/* Summary */}
        <div className="px-4 mt-4 mb-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="card">
              <p className="text-2xl font-display font-black text-dark">
                {riders.filter(r => r.isLowBalance).length}
              </p>
              <p className="text-xs text-red-500 font-semibold">⚠️ Low Balance</p>
            </div>
            <div className="card">
              <p className="text-2xl font-display font-black text-dark">
                {riders.reduce((s, r) => s + r.coinBalance, 0).toLocaleString()}
              </p>
              <p className="text-xs text-gray-400">Total Coins (ကျပ်)</p>
            </div>
          </div>
        </div>

        {/* Riders List */}
        <div className="px-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Riders Wallet
          </p>
          <div className="space-y-3 stagger">
            {riders.map(rider => (
              <div key={rider.id} className={`card animate-slide-up border-2 ${rider.isLowBalance ? "border-red-200" : "border-transparent"}`}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="relative">
                    <div className="w-10 h-10 bg-primary-100 rounded-2xl flex items-center justify-center text-lg">🏍️</div>
                    {rider.isLowBalance && (
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                        <span className="text-[8px] text-white font-bold">!</span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-display font-bold text-dark">{rider.name}</p>
                    <p className="text-xs text-gray-400">{rider.phone}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-base font-display font-black ${rider.isLowBalance ? "text-red-500" : "text-dark"}`}>
                      {rider.coinBalance.toLocaleString()}
                    </p>
                    <p className="text-[10px] text-gray-400">ကျပ်</p>
                  </div>
                </div>

                <div className="flex gap-3 text-[10px] text-gray-400 mb-3">
                  <span>📈 ရငွေ: {rider.totalEarned.toLocaleString()}</span>
                  <span>📊 Commission: {rider.totalCommission.toLocaleString()}</span>
                </div>

                <button
                  onClick={() => setSelectedRider(rider)}
                  className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all
                    ${rider.isLowBalance
                      ? "bg-red-500 text-white shadow-sm"
                      : "bg-primary-500 text-white shadow-primary"
                    }`}
                >
                  💰 Coin ဖြည့်မည်
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top-up Modal */}
      {selectedRider && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
          <div className="bg-white w-full rounded-t-3xl p-5 animate-slide-up">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs text-gray-400">Coin ဖြည့်မည်</p>
                <p className="font-display font-black text-dark text-lg">{selectedRider.name}</p>
                <p className="text-xs text-gray-400">
                  လက်ကျန်: <span className="font-bold text-primary-500">{selectedRider.coinBalance.toLocaleString()} ကျပ်</span>
                </p>
              </div>
              <button onClick={() => setSelectedRider(null)} className="text-gray-400 text-2xl">×</button>
            </div>

            {/* Quick amounts */}
            <div className="grid grid-cols-4 gap-2 mb-4">
              {quickAmounts.map(amt => (
                <button
                  key={amt}
                  onClick={() => setTopUpAmount(String(amt))}
                  className={`py-2 rounded-xl text-xs font-bold border-2 transition-all
                    ${topUpAmount === String(amt)
                      ? "border-primary-500 bg-primary-500 text-white"
                      : "border-gray-200 text-gray-600"
                    }`}
                >
                  {(amt/1000).toFixed(0)}K
                </button>
              ))}
            </div>

            <input
              type="number"
              placeholder="Amount (ကျပ်)"
              value={topUpAmount}
              onChange={e => setTopUpAmount(e.target.value)}
              className="input-field mb-3"
            />
            <input
              type="text"
              placeholder="မှတ်ချက် (optional)"
              value={note}
              onChange={e => setNote(e.target.value)}
              className="input-field mb-4"
            />

            {topUpAmount && (
              <div className="bg-green-50 rounded-xl p-3 mb-4 text-center">
                <p className="text-xs text-gray-500">ဖြည့်ပြီးရင် လက်ကျန်</p>
                <p className="text-xl font-display font-black text-green-600">
                  {(selectedRider.coinBalance + parseInt(topUpAmount || 0)).toLocaleString()} ကျပ်
                </p>
              </div>
            )}

            <button
              onClick={handleTopUp}
              disabled={!topUpAmount || loading}
              className="btn-primary"
            >
              {loading ? "လုပ်ဆောင်နေသည်..." : `💰 ${parseInt(topUpAmount || 0).toLocaleString()} ကျပ် ဖြည့်မည်`}
            </button>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  )
}
