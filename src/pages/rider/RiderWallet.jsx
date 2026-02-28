// src/pages/rider/RiderWallet.jsx
import { useState, useEffect } from "react"
import { useAuth } from "../../context/AuthContext"
import Navbar from "../../components/common/Navbar"
import BottomNav from "../../components/common/BottomNav"
import { listenToRiderBalance, listenToTransactions } from "../../services/walletService"

export default function RiderWallet() {
  const { user } = useAuth()
  const [wallet, setWallet] = useState({
    coinBalance: 5000,
    totalEarned: 25000,
    totalCommission: 2500,
    isLowBalance: false,
  })
  const [transactions, setTransactions] = useState([
    {
      id: "t1", type: "topup", amount: 5000, commission: 0,
      netAmount: 5000, note: "Admin top-up", balanceAfter: 5000,
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000)
    },
    {
      id: "t2", type: "commission", amount: 3500, commission: 350,
      netAmount: 3150, note: "Order #ORD001 - 10% commission",
      balanceAfter: 4650, createdAt: new Date(Date.now() - 30 * 60 * 1000)
    },
    {
      id: "t3", type: "commission", amount: 5000, commission: 500,
      netAmount: 4500, note: "Order #ORD002 - 10% commission",
      balanceAfter: 4150, createdAt: new Date(Date.now() - 10 * 60 * 1000)
    },
  ])

  // Firebase connect လုပ်ပြီးရင် uncomment လုပ်
  // useEffect(() => {
  //   const unsubBalance = listenToRiderBalance(user.uid, setWallet)
  //   const unsubTx = listenToTransactions(user.uid, setTransactions)
  //   return () => { unsubBalance(); unsubTx() }
  // }, [user.uid])

  const timeAgo = (date) => {
    const mins = Math.floor((Date.now() - date) / 60000)
    if (mins < 60) return `${mins} မိနစ်ကြာပြီ`
    return `${Math.floor(mins / 60)} နာရီကြာပြီ`
  }

  return (
    <div className="flex flex-col h-screen bg-surface">
      <Navbar title="Wallet" />

      <div className="flex-1 overflow-y-auto pb-24">

        {/* Low Balance Warning */}
        {wallet.isLowBalance && (
          <div className="mx-4 mt-4 bg-red-50 border border-red-200 rounded-2xl p-3 flex items-center gap-2 animate-slide-up">
            <span className="text-xl">⚠️</span>
            <div>
              <p className="text-xs font-bold text-red-600">Coin နည်းနေပြီ!</p>
              <p className="text-xs text-red-400">Admin ကို coin ဖြည့်ပေးဖို့ ပြောပါ</p>
            </div>
          </div>
        )}

        {/* Balance Card */}
        <div className="px-4 mt-4 animate-slide-up">
          <div className="bg-dark rounded-3xl p-5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500 rounded-full opacity-10 blur-2xl -translate-y-1/2 translate-x-1/2" />
            <p className="text-gray-400 text-xs font-body mb-1">💰 လက်ကျန် Coin</p>
            <p className="text-4xl font-display font-black text-white">
              {wallet.coinBalance.toLocaleString()}
              <span className="text-primary-400 text-lg ml-1">ကျပ်</span>
            </p>

            <div className="flex gap-4 mt-4 pt-4 border-t border-white/10">
              <div>
                <p className="text-xs text-gray-400">စုစုပေါင်း ရငွေ</p>
                <p className="text-sm font-display font-bold text-green-400">
                  +{wallet.totalEarned.toLocaleString()} ကျပ်
                </p>
              </div>
              <div className="w-px bg-white/10" />
              <div>
                <p className="text-xs text-gray-400">Commission နုတ်</p>
                <p className="text-sm font-display font-bold text-red-400">
                  -{wallet.totalCommission.toLocaleString()} ကျပ်
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Commission Info */}
        <div className="px-4 mt-3 animate-slide-up" style={{ animationDelay: "0.05s" }}>
          <div className="card flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-100 rounded-2xl flex items-center justify-center text-xl">📊</div>
            <div>
              <p className="text-sm font-display font-bold text-dark">Commission Rate</p>
              <p className="text-xs text-gray-400">Delivery တစ်ခုလျှင် <span className="text-primary-500 font-bold">10%</span> နုတ်ယူသည်</p>
            </div>
          </div>
        </div>

        {/* Commission Calculator */}
        <div className="px-4 mt-3 animate-slide-up" style={{ animationDelay: "0.1s" }}>
          <div className="card">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Commission ကြိုတင်တွက်ချက်
            </p>
            <div className="grid grid-cols-3 gap-2">
              {[3000, 5000, 8000, 10000, 15000, 20000].map(amount => (
                <div key={amount} className="bg-surface rounded-xl p-2 text-center">
                  <p className="text-xs text-gray-500">{amount.toLocaleString()}</p>
                  <p className="text-xs font-bold text-red-500">
                    -{(amount * 0.1).toLocaleString()}
                  </p>
                  <p className="text-xs font-bold text-green-600">
                    ={(amount * 0.9).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-2 px-1">
              <span className="text-[10px] text-gray-400">Delivery ခ</span>
              <span className="text-[10px] text-red-400">Commission (10%)</span>
              <span className="text-[10px] text-green-500">ရငွေ (90%)</span>
            </div>
          </div>
        </div>

        {/* Transaction History */}
        <div className="px-4 mt-3 animate-slide-up" style={{ animationDelay: "0.15s" }}>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Transaction History
          </p>
          <div className="space-y-2 stagger">
            {transactions.map(tx => (
              <div key={tx.id} className="card animate-slide-up">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-xl
                    ${tx.type === "topup" ? "bg-green-100" : "bg-red-100"}`}>
                    {tx.type === "topup" ? "💰" : "📦"}
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-dark">{tx.note}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">{timeAgo(tx.createdAt)}</p>
                  </div>
                  <div className="text-right">
                    {tx.type === "topup" ? (
                      <p className="text-sm font-display font-black text-green-500">
                        +{tx.amount.toLocaleString()}
                      </p>
                    ) : (
                      <div>
                        <p className="text-xs font-bold text-red-500">
                          -{tx.commission.toLocaleString()} ကျပ်
                        </p>
                        <p className="text-[10px] text-gray-400">
                          လက်ကျန်: {tx.balanceAfter.toLocaleString()}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  )
}
