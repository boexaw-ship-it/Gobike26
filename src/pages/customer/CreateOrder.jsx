// src/pages/customer/CreateOrder.jsx
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { collection, addDoc, serverTimestamp } from "firebase/firestore"
import { db } from "../../firebase/config"
import { alertAdminNewOrder } from "../../services/telegramBot"
import { useAuth } from "../../context/AuthContext"
import Navbar from "../../components/common/Navbar"
import BottomNav from "../../components/common/BottomNav"
import MapView from "../../components/map/MapView"

const YANGON_LOCATIONS = [
  { address: "ဗဟန်း မြို့နယ်",        lat: 16.8409, lng: 96.1353 },
  { address: "ကမာရွတ် မြို့နယ်",       lat: 16.8500, lng: 96.1200 },
  { address: "တာမွေ မြို့နယ်",         lat: 16.8200, lng: 96.1600 },
  { address: "ဒဂုံ မြို့နယ်",           lat: 16.8700, lng: 96.1900 },
  { address: "မရမ်းကုန်း မြို့နယ်",     lat: 16.8800, lng: 96.1100 },
  { address: "စမ်းချောင်း မြို့နယ်",    lat: 16.8600, lng: 96.1300 },
  { address: "လှိုင် မြို့နယ်",          lat: 16.8900, lng: 96.1500 },
  { address: "သင်္ဃန်းကျွန်း မြို့နယ်", lat: 16.8100, lng: 96.1700 },
  { address: "ဒေါပုံ မြို့နယ်",          lat: 16.7900, lng: 96.1800 },
  { address: "မင်္ဂလာဒုံ မြို့နယ်",      lat: 16.9100, lng: 96.1600 },
  { address: "ရန်ကင်း မြို့နယ်",        lat: 16.8700, lng: 96.1400 },
  { address: "ပုဇွန်တောင် မြို့နယ်",    lat: 16.8300, lng: 96.1500 },
  { address: "ကြည့်မြင်တိုင် မြို့နယ်", lat: 16.8400, lng: 96.1250 },
  { address: "အင်းစိန် မြို့နယ်",        lat: 16.9000, lng: 96.0900 },
  { address: "မင်္ဂလာတောင်ညွန့် မြို့နယ်", lat: 16.8550, lng: 96.1450 },
]

const ITEM_TYPES = [
  { value: "document",  label: "📄 စာရွက်စာတမ်း" },
  { value: "food",      label: "🍱 အစားအစာ" },
  { value: "clothes",   label: "👗 အဝတ်အထည်" },
  { value: "medicine",  label: "💊 ဆေးဝါး" },
  { value: "electronic",label: "📱 လျှပ်စစ်ပစ္စည်း" },
  { value: "other",     label: "📦 အခြား" },
]

const calcPrice = (pickup, dropoff) => {
  if (!pickup || !dropoff) return 0
  const dist = Math.sqrt(
    Math.pow((pickup.lat - dropoff.lat) * 111, 2) +
    Math.pow((pickup.lng - dropoff.lng) * 111, 2)
  )
  return Math.round(dist * 800 + 1500)
}

export default function CreateOrder() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [step, setStep] = useState(1)
  const [pickup, setPickup] = useState(null)
  const [dropoff, setDropoff] = useState(null)
  const [itemType, setItemType] = useState("")
  const [itemValue, setItemValue] = useState("")
  const [phone, setPhone] = useState(user?.phone || "")
  const [note, setNote] = useState("")
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const price = calcPrice(pickup, dropoff)

  const handleSubmit = async () => {
    setLoading(true)
    try {
      const docRef = await addDoc(collection(db, "orders"), {
        customerId:   user.uid,
        customerName: user.name,
        customerPhone: phone,
        itemType,
        itemValue:    Number(itemValue),
        pickup:       { address: pickup.address, lat: pickup.lat, lng: pickup.lng },
        dropoff:      { address: dropoff.address, lat: dropoff.lat, lng: dropoff.lng },
        deliveryFee:  price,
        note,
        status:       "pending",
        riderId:      null,
        riderName:    null,
        createdAt:    serverTimestamp(),
        updatedAt:    serverTimestamp(),
      })
      await alertAdminNewOrder({
        id: docRef.id,
        customerId: user.uid,
        customerName: user.name,
        customerPhone: phone,
        pickup,
        dropoff,
        price,
        itemType,
        note,
      })
      setSubmitted(true)
      setTimeout(() => navigate("/customer"), 2500)
    } catch (err) {
      alert("Order တင်ရာတွင် အမှားတစ်ခု ဖြစ်ပေါ်သည်")
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center flex-col gap-4 px-6">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center text-4xl animate-bounce">✅</div>
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

  const steps = ["နေရာ", "အချက်အလက်", "အတည်ပြု"]

  return (
    <div className="flex flex-col h-screen bg-surface">
      <Navbar title="Order ပို့မည်" />
      <div className="flex-1 overflow-y-auto pb-28">

        {/* Progress */}
        <div className="px-4 py-4">
          <div className="flex items-center gap-2">
            {[1, 2, 3].map(s => (
              <div key={s} className="flex items-center flex-1">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all
                  ${step >= s ? "bg-primary-500 text-white" : "bg-gray-200 text-gray-400"}`}>{s}</div>
                {s < 3 && <div className={`flex-1 h-1 mx-1 rounded transition-all ${step > s ? "bg-primary-500" : "bg-gray-200"}`} />}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-1">
            {steps.map(s => <span key={s} className="text-[10px] text-gray-400">{s}</span>)}
          </div>
        </div>

        {/* Map */}
        <div className="px-4 mb-4">
          <div className="h-44 rounded-3xl overflow-hidden shadow-card">
            <MapView pickupPoint={pickup} dropoffPoint={dropoff} height="100%" />
          </div>
        </div>

        {/* Step 1 - Locations */}
        {step === 1 && (
          <div className="px-4 animate-slide-up space-y-4">
            <div>
              <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider">📦 ယူမည့်နေရာ</p>
              <div className="space-y-2">
                {YANGON_LOCATIONS.map(loc => (
                  <button key={loc.address} onClick={() => setPickup(loc)}
                    className={`w-full card text-left active:scale-[0.98] transition-all
                      ${pickup?.address === loc.address ? "border-2 border-primary-500 bg-primary-50" : ""}`}>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-sm">📦</div>
                      <span className="text-sm font-body text-gray-700">{loc.address}</span>
                      {pickup?.address === loc.address && <span className="ml-auto text-primary-500">✓</span>}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {pickup && (
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider">🎯 ပို့မည့်နေရာ</p>
                <div className="space-y-2">
                  {YANGON_LOCATIONS.filter(l => l.address !== pickup?.address).map(loc => (
                    <button key={loc.address} onClick={() => setDropoff(loc)}
                      className={`w-full card text-left active:scale-[0.98] transition-all
                        ${dropoff?.address === loc.address ? "border-2 border-primary-500 bg-primary-50" : ""}`}>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center text-sm">🎯</div>
                        <span className="text-sm font-body text-gray-700">{loc.address}</span>
                        {dropoff?.address === loc.address && <span className="ml-auto text-primary-500">✓</span>}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 2 - Item Details */}
        {step === 2 && (
          <div className="px-4 animate-slide-up space-y-4">
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-2 block uppercase tracking-wider">📦 ပစ္စည်းအမျိုးအစား</label>
              <div className="grid grid-cols-2 gap-2">
                {ITEM_TYPES.map(t => (
                  <button key={t.value} onClick={() => setItemType(t.value)}
                    className={`card text-left text-sm py-3 active:scale-[0.98] transition-all
                      ${itemType === t.value ? "border-2 border-primary-500 bg-primary-50" : ""}`}>
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block uppercase tracking-wider">💰 ပစ္စည်းတန်ဖိုး (ကျပ်)</label>
              <input type="number" placeholder="ဥပမာ - 50000" value={itemValue}
                onChange={e => setItemValue(e.target.value)} className="input-field" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block uppercase tracking-wider">📞 ဆက်သွယ်ရန် ဖုန်းနံပါတ်</label>
              <input type="tel" placeholder="09xxxxxxxx" value={phone}
                onChange={e => setPhone(e.target.value)} className="input-field" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block uppercase tracking-wider">📝 မှတ်ချက်</label>
              <textarea rows={3} placeholder="ထူးခြားသောညွှန်ကြားချက်..." value={note}
                onChange={e => setNote(e.target.value)} className="input-field resize-none" />
            </div>
          </div>
        )}

        {/* Step 3 - Confirm */}
        {step === 3 && (
          <div className="px-4 animate-slide-up">
            <div className="card mb-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">📦</div>
                <div>
                  <p className="text-xs text-gray-400">ယူမည့်နေရာ</p>
                  <p className="text-sm font-semibold">{pickup?.address}</p>
                </div>
              </div>
              <div className="w-px h-4 bg-gray-200 ml-4" />
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">🎯</div>
                <div>
                  <p className="text-xs text-gray-400">ပို့မည့်နေရာ</p>
                  <p className="text-sm font-semibold">{dropoff?.address}</p>
                </div>
              </div>
              <div className="border-t border-gray-100 pt-3 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">ပစ္စည်းအမျိုးအစား</span>
                  <span className="font-semibold">{ITEM_TYPES.find(t => t.value === itemType)?.label}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">ပစ္စည်းတန်ဖိုး</span>
                  <span className="font-semibold">{Number(itemValue).toLocaleString()} ကျပ်</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">ဖုန်းနံပါတ်</span>
                  <span className="font-semibold">{phone}</span>
                </div>
                <div className="flex justify-between text-sm pt-2 border-t border-gray-100">
                  <span className="text-gray-500 font-semibold">Delivery Fee</span>
                  <span className="text-xl font-display font-black text-primary-500">{price.toLocaleString()} ကျပ်</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Buttons */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 py-4 pb-8">
        {step === 1 && (
          <button onClick={() => setStep(2)} disabled={!pickup || !dropoff} className="btn-primary disabled:opacity-50">
            ဆက်လက်မည် →
          </button>
        )}
        {step === 2 && (
          <div className="flex gap-3">
            <button onClick={() => setStep(1)} className="flex-1 py-4 rounded-2xl border border-gray-200 font-bold text-gray-500">← ပြန်သွား</button>
            <button onClick={() => setStep(3)} disabled={!itemType || !itemValue || !phone}
              className="flex-[2] btn-primary disabled:opacity-50">ဆက်လက်မည် →</button>
          </div>
        )}
        {step === 3 && (
          <div className="flex gap-3">
            <button onClick={() => setStep(2)} className="flex-1 py-4 rounded-2xl border border-gray-200 font-bold text-gray-500">← ပြန်သွား</button>
            <button onClick={handleSubmit} disabled={loading} className="flex-[2] btn-primary disabled:opacity-50">
              {loading ? "တင်နေသည်..." : `📦 Order တင်မည် (${price.toLocaleString()} ကျပ်)`}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
