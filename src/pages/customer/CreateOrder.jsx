// src/pages/customer/CreateOrder.jsx
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import Navbar from "../../components/common/Navbar"
import BottomNav from "../../components/common/BottomNav"
import MapView from "../../components/map/MapView"

const YANGON_LOCATIONS = [
  { address: "ဗဟန်း မြို့နယ်", lat: 16.8409, lng: 96.1353 },
  { address: "ကမာရွတ် မြို့နယ်", lat: 16.8500, lng: 96.1200 },
  { address: "တာမွေ မြို့နယ်", lat: 16.8200, lng: 96.1600 },
  { address: "ဒဂုံ မြို့နယ်", lat: 16.8700, lng: 96.1900 },
  { address: "မရမ်းကုန်း မြို့နယ်", lat: 16.8800, lng: 96.1100 },
]

export default function CreateOrder() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [pickup, setPickup] = useState(null)
  const [dropoff, setDropoff] = useState(null)
  const [note, setNote] = useState("")
  const [submitted, setSubmitted] = useState(false)

  const calcPrice = () => {
    if (!pickup || !dropoff) return 0
    const dist = Math.abs(pickup.lat - dropoff.lat) * 111 + Math.abs(pickup.lng - dropoff.lng) * 111
    return Math.round(dist * 800 + 1500)
  }

  const handleSubmit = () => {
    setSubmitted(true)
    setTimeout(() => navigate("/customer"), 2000)
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center flex-col gap-4 px-6">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center text-4xl animate-bounce">
          ✅
        </div>
        <h2 className="text-2xl font-display font-black text-dark">Order တင်ပြီ!</h2>
        <p className="text-gray-400 text-sm text-center font-body">Rider တစ်ဦး သင့်အော်ဒါကို လာယူပါလိမ့်မည်</p>
        <div className="flex gap-2">
          <div className="w-2 h-2 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: "0s" }} />
          <div className="w-2 h-2 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
          <div className="w-2 h-2 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: "0.4s" }} />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen bg-surface">
      <Navbar title="Order" />

      <div className="flex-1 overflow-y-auto pb-28">

        {/* Progress */}
        <div className="px-4 py-4">
          <div className="flex items-center gap-2">
            {[1, 2, 3].map(s => (
              <div key={s} className="flex items-center flex-1">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all
                  ${step >= s ? "bg-primary-500 text-white" : "bg-gray-200 text-gray-400"}`}>
                  {s}
                </div>
                {s < 3 && (
                  <div className={`flex-1 h-1 mx-1 rounded transition-all ${step > s ? "bg-primary-500" : "bg-gray-200"}`} />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-[10px] text-gray-400">Pickup</span>
            <span className="text-[10px] text-gray-400">Dropoff</span>
            <span className="text-[10px] text-gray-400">Confirm</span>
          </div>
        </div>

        {/* Map */}
        <div className="px-4 mb-4">
          <div className="h-44 rounded-3xl overflow-hidden shadow-card">
            <MapView
              pickupPoint={pickup}
              dropoffPoint={dropoff}
              height="100%"
            />
          </div>
        </div>

        {/* Step 1: Pickup */}
        {step === 1 && (
          <div className="px-4 animate-slide-up">
            <p className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wider">📦 Pickup Location</p>
            <div className="space-y-2">
              {YANGON_LOCATIONS.map(loc => (
                <button
                  key={loc.address}
                  onClick={() => { setPickup(loc); setStep(2) }}
                  className={`w-full card text-left active:scale-[0.98] transition-all
                    ${pickup?.address === loc.address ? "border-2 border-primary-500" : ""}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-sm">📦</div>
                    <span className="text-sm font-body text-gray-700">{loc.address}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Dropoff */}
        {step === 2 && (
          <div className="px-4 animate-slide-up">
            <div className="flex items-center gap-2 mb-3">
              <button onClick={() => setStep(1)} className="text-primary-500 text-sm">← Back</button>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">🎯 Dropoff Location</p>
            </div>
            <div className="space-y-2">
              {YANGON_LOCATIONS.filter(l => l.address !== pickup?.address).map(loc => (
                <button
                  key={loc.address}
                  onClick={() => { setDropoff(loc); setStep(3) }}
                  className="w-full card text-left active:scale-[0.98] transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center text-sm">🎯</div>
                    <span className="text-sm font-body text-gray-700">{loc.address}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Confirm */}
        {step === 3 && (
          <div className="px-4 animate-slide-up">
            <div className="flex items-center gap-2 mb-3">
              <button onClick={() => setStep(2)} className="text-primary-500 text-sm">← Back</button>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">✅ Confirm Order</p>
            </div>

            <div className="card mb-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-sm">📦</div>
                  <div>
                    <p className="text-xs text-gray-400">Pickup</p>
                    <p className="text-sm font-semibold text-gray-700">{pickup?.address}</p>
                  </div>
                </div>
                <div className="w-px h-4 bg-gray-200 ml-4" />
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center text-sm">🎯</div>
                  <div>
                    <p className="text-xs text-gray-400">Dropoff</p>
                    <p className="text-sm font-semibold text-gray-700">{dropoff?.address}</p>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
                <span className="text-xs text-gray-400">Estimated Price</span>
                <span className="text-xl font-display font-black text-primary-500">{calcPrice().toLocaleString()} ကျပ်</span>
              </div>
            </div>

            <div className="mb-4">
              <label className="text-xs font-semibold text-gray-500 mb-1 block">မှတ်ချက် (Optional)</label>
              <textarea
                rows={3}
                placeholder="ထူးခြားသောညွှန်ကြားချက်..."
                value={note}
                onChange={e => setNote(e.target.value)}
                className="input-field resize-none"
              />
            </div>
          </div>
        )}
      </div>

      {/* Bottom CTA */}
      {step === 3 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 py-4 pb-8">
          <button onClick={handleSubmit} className="btn-primary">
            📦 Order တင်မည် ({calcPrice().toLocaleString()} ကျပ်)
          </button>
        </div>
      )}

      {step < 3 && <BottomNav />}
    </div>
  )
}
