// src/pages/customer/CreateOrder.jsx
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { collection, addDoc, serverTimestamp, doc, updateDoc } from "firebase/firestore"
import { db } from "../../firebase/config"
import { useAuth } from "../../context/AuthContext"
import Navbar from "../../components/common/Navbar"
import BottomNav from "../../components/common/BottomNav"
import MapView from "../../components/map/MapView"

const YANGON_LOCATIONS = [
  { address: "ဗဟန်း မြို့နယ်",              lat: 16.8409, lng: 96.1353 },
  { address: "ကမာရွတ် မြို့နယ်",             lat: 16.8500, lng: 96.1200 },
  { address: "တာမွေ မြို့နယ်",               lat: 16.8200, lng: 96.1600 },
  { address: "ဒဂုံ မြို့နယ်",                 lat: 16.8700, lng: 96.1900 },
  { address: "မရမ်းကုန်း မြို့နယ်",           lat: 16.8800, lng: 96.1100 },
  { address: "စမ်းချောင်း မြို့နယ်",          lat: 16.8600, lng: 96.1300 },
  { address: "လှိုင် မြို့နယ်",                lat: 16.8900, lng: 96.1500 },
  { address: "သင်္ဃန်းကျွန်း မြို့နယ်",       lat: 16.8100, lng: 96.1700 },
  { address: "ဒေါပုံ မြို့နယ်",                lat: 16.7900, lng: 96.1800 },
  { address: "မင်္ဂလာဒုံ မြို့နယ်",            lat: 16.9100, lng: 96.1600 },
  { address: "ရန်ကင်း မြို့နယ်",              lat: 16.8700, lng: 96.1400 },
  { address: "ပုဇွန်တောင် မြို့နယ်",          lat: 16.8300, lng: 96.1500 },
  { address: "ကြည့်မြင်တိုင် မြို့နယ်",       lat: 16.8400, lng: 96.1250 },
  { address: "အင်းစိန် မြို့နယ်",              lat: 16.9000, lng: 96.0900 },
  { address: "မင်္ဂလာတောင်ညွန့် မြို့နယ်",   lat: 16.8550, lng: 96.1450 },
  { address: "ဆိပ်ကြီးခနောင်တို မြို့နယ်",   lat: 16.7800, lng: 96.2100 },
  { address: "သာကေတ မြို့နယ်",              lat: 16.8000, lng: 96.1900 },
  { address: "တောင်ဥက္ကလာပ မြို့နယ်",       lat: 16.8300, lng: 96.2000 },
  { address: "မြောက်ဥက္ကလာပ မြို့နယ်",      lat: 16.8500, lng: 96.2000 },
  { address: "ဒဂုံဆိပ်ကမ်း မြို့နယ်",         lat: 16.8400, lng: 96.2200 },
  { address: "လှိုင်သာယာ မြို့နယ်",           lat: 16.9200, lng: 96.0700 },
  { address: "ရွှေပြည်သာ မြို့နယ်",           lat: 16.9500, lng: 96.0500 },
  { address: "မောင်တောင် မြို့နယ်",           lat: 16.7600, lng: 96.1600 },
  { address: "တွံတေး မြို့နယ်",               lat: 17.0300, lng: 96.0700 },
  { address: "ကျောက်တံတား မြို့နယ်",         lat: 16.7800, lng: 96.1600 },
  { address: "ပုလဲ မြို့နယ်",                  lat: 16.7700, lng: 96.1700 },
  { address: "ကော်မှူး မြို့နယ်",              lat: 16.7600, lng: 96.1900 },
  { address: "လှည်းကူး မြို့နယ်",              lat: 17.0800, lng: 96.1700 },
  { address: "ဒိုက်ဦး မြို့နယ်",                lat: 17.1000, lng: 96.0800 },
  { address: "တိုက်ကြီး မြို့နယ်",              lat: 17.0500, lng: 96.2000 },
]

const ITEM_TYPES = [
  { value: "document",   label: "📄 စာရွက်စာတမ်း" },
  { value: "food",       label: "🍱 အစားအစာ" },
  { value: "clothes",    label: "👗 အဝတ်အထည်" },
  { value: "medicine",   label: "💊 ဆေးဝါး" },
  { value: "electronic", label: "📱 လျှပ်စစ်ပစ္စည်း" },
  { value: "other",      label: "📦 အခြား" },
]

const DELIVERY_RATE = 0.10 // 10% commission

const calcDeliveryFee = (pickup, dropoff) => {
  if (!pickup || !dropoff) return 0
  const dist = Math.sqrt(
    Math.pow((pickup.lat - dropoff.lat) * 111, 2) +
    Math.pow((pickup.lng - dropoff.lng) * 111, 2)
  )
  return Math.round(dist * 800 + 1500)
}

async function sendTelegram(order) {
  const BOT_TOKEN = import.meta.env.VITE_TELEGRAM_BOT_TOKEN
  const CHAT_ID   = import.meta.env.VITE_TELEGRAM_ADMIN_CHAT_ID
  if (!BOT_TOKEN || !CHAT_ID) return

  const now = new Date()
  const time = now.toLocaleString("en-GB", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit", hour12: true
  })

  const commission = Math.round(order.deliveryFee * DELIVERY_RATE)
  const riderNet   = order.deliveryFee - commission

  const text = `
🆕 <b>Order သစ် ဝင်လာပြီ!</b>
━━━━━━━━━━━━━━━━
📦 <b>Order #${order.id?.slice(-6).toUpperCase()}</b>
⏰ <b>အချိန်:</b> ${time}
━━━━━━━━━━━━━━━━
👤 <b>Customer:</b> ${order.customerName}
📞 <b>ဖုန်း:</b> ${order.customerPhone}
💳 <b>ငွေပေးချေမှု:</b> ${order.paymentType === "cod" ? "Cash on Delivery 💵" : "Cash Pay ✅"}
━━━━━━━━━━━━━━━━
📍 <b>ယူမည့်နေရာ:</b> ${order.pickup.address}
🎯 <b>ပို့မည့်နေရာ:</b> ${order.dropoff.address}
━━━━━━━━━━━━━━━━
🏷️ <b>ပစ္စည်းအမျိုး:</b> ${order.itemTypeLabel}
💎 <b>ပစ္စည်းတန်ဖိုး:</b> ${Number(order.itemValue).toLocaleString()} ကျပ်
━━━━━━━━━━━━━━━━
🚚 <b>Delivery Fee:</b> ${order.deliveryFee.toLocaleString()} ကျပ်
📊 <b>Commission (10%):</b> ${commission.toLocaleString()} ကျပ်
🏍️ <b>Rider ရမည်:</b> ${riderNet.toLocaleString()} ကျပ်
━━━━━━━━━━━━━━━━
${order.note ? `📝 <b>မှတ်ချက်:</b> ${order.note}` : ""}
🔍 <b>Status:</b> Pending ⏳
  `.trim()

  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: CHAT_ID, text, parse_mode: "HTML" }),
  })
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
  const [paymentType, setPaymentType] = useState("cod")
  const [note, setNote] = useState("")
  const [loading, setLoading] = useState(false)
  const [orderId, setOrderId] = useState(null)
  const [submitted, setSubmitted] = useState(false)

  const deliveryFee = calcDeliveryFee(pickup, dropoff)
  const commission  = Math.round(deliveryFee * DELIVERY_RATE)
  const riderNet    = deliveryFee - commission

  const resetForm = () => {
    setStep(1); setPickup(null); setDropoff(null)
    setItemType(""); setItemValue(""); setNote("")
    setPaymentType("cod"); setSubmitted(false); setOrderId(null)
  }

  const handleSubmit = async () => {
    setLoading(true)
    try {
      const itemTypeLabel = ITEM_TYPES.find(t => t.value === itemType)?.label || itemType
      const orderData = {
        customerId:     user.uid,
        customerName:   user.name,
        customerPhone:  phone,
        itemType,
        itemTypeLabel,
        itemValue:      Number(itemValue),
        pickup:         { address: pickup.address, lat: pickup.lat, lng: pickup.lng },
        dropoff:        { address: dropoff.address, lat: dropoff.lat, lng: dropoff.lng },
        deliveryFee,
        commission,
        riderNet,
        paymentType,
        note,
        status:         "pending",
        riderId:        null,
        riderName:      null,
        createdAt:      serverTimestamp(),
        updatedAt:      serverTimestamp(),
      }
      const docRef = await addDoc(collection(db, "orders"), orderData)
      setOrderId(docRef.id)
      await sendTelegram({ ...orderData, id: docRef.id })
      setSubmitted(true)
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
        <p className="text-gray-400 text-sm text-center">Rider တစ်ဦး သင့်အော်ဒါကို လာယူပါလိမ့်မည်</p>
        <p className="text-xs text-gray-300">#{orderId?.slice(-6).toUpperCase()}</p>
        <div className="flex gap-3 mt-2">
          <button onClick={resetForm} className="px-6 py-3 bg-primary-500 text-white font-bold rounded-2xl">
            ➕ Order ထပ်တင်
          </button>
          <button onClick={() => navigate("/customer")} className="px-6 py-3 border border-gray-200 text-gray-600 font-bold rounded-2xl">
            Home
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen bg-surface">
      <Navbar title="Order ပို့မည်" />
      <div className="flex-1 overflow-y-auto pb-28">

        {/* Progress */}
        <div className="px-4 py-4">
          <div className="flex items-center gap-2">
            {[1,2,3].map(s => (
              <div key={s} className="flex items-center flex-1">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all
                  ${step >= s ? "bg-primary-500 text-white" : "bg-gray-200 text-gray-400"}`}>{s}</div>
                {s < 3 && <div className={`flex-1 h-1 mx-1 rounded ${step > s ? "bg-primary-500" : "bg-gray-200"}`} />}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-1">
            {["နေရာ","အချက်အလက်","အတည်ပြု"].map(s => (
              <span key={s} className="text-[10px] text-gray-400">{s}</span>
            ))}
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
          <div className="px-4 space-y-4">
            <div>
              <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider">📦 ယူမည့်နေရာ</p>
              <div className="space-y-2">
                {YANGON_LOCATIONS.map(loc => (
                  <button key={loc.address} onClick={() => setPickup(loc)}
                    className={`w-full card text-left active:scale-[0.98] transition-all
                      ${pickup?.address === loc.address ? "border-2 border-primary-500 bg-primary-50" : ""}`}>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">📦</div>
                      <span className="text-sm text-gray-700">{loc.address}</span>
                      {pickup?.address === loc.address && <span className="ml-auto text-primary-500 font-bold">✓</span>}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {pickup && (
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider">🎯 ပို့မည့်နေရာ</p>
                <div className="space-y-2">
                  {YANGON_LOCATIONS.filter(l => l.address !== pickup.address).map(loc => (
                    <button key={loc.address} onClick={() => setDropoff(loc)}
                      className={`w-full card text-left active:scale-[0.98] transition-all
                        ${dropoff?.address === loc.address ? "border-2 border-primary-500 bg-primary-50" : ""}`}>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">🎯</div>
                        <span className="text-sm text-gray-700">{loc.address}</span>
                        {dropoff?.address === loc.address && <span className="ml-auto text-primary-500 font-bold">✓</span>}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 2 - Details */}
        {step === 2 && (
          <div className="px-4 space-y-4">
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-2 block uppercase tracking-wider">📦 ပစ္စည်းအမျိုးအစား</label>
              <div className="grid grid-cols-2 gap-2">
                {ITEM_TYPES.map(t => (
                  <button key={t.value} onClick={() => setItemType(t.value)}
                    className={`card text-sm py-3 active:scale-[0.98] transition-all
                      ${itemType === t.value ? "border-2 border-primary-500 bg-primary-50" : ""}`}>
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block uppercase tracking-wider">💎 ပစ္စည်းတန်ဖိုး (ကျပ်)</label>
              <input type="number" placeholder="ဥပမာ - 50000" value={itemValue}
                onChange={e => setItemValue(e.target.value)} className="input-field" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block uppercase tracking-wider">📞 ဆက်သွယ်ရန် ဖုန်းနံပါတ်</label>
              <input type="tel" placeholder="09xxxxxxxx" value={phone}
                onChange={e => setPhone(e.target.value)} className="input-field" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-2 block uppercase tracking-wider">💳 ငွေပေးချေမှု</label>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => setPaymentType("cod")}
                  className={`card py-3 text-sm font-semibold active:scale-[0.98] transition-all
                    ${paymentType === "cod" ? "border-2 border-primary-500 bg-primary-50 text-primary-600" : "text-gray-600"}`}>
                  💵 Cash on Delivery
                </button>
                <button onClick={() => setPaymentType("cash")}
                  className={`card py-3 text-sm font-semibold active:scale-[0.98] transition-all
                    ${paymentType === "cash" ? "border-2 border-primary-500 bg-primary-50 text-primary-600" : "text-gray-600"}`}>
                  ✅ Cash Pay
                </button>
              </div>
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
          <div className="px-4">
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
                  <span className="text-gray-400">ပစ္စည်းအမျိုး</span>
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
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">ငွေပေးချေမှု</span>
                  <span className="font-semibold">{paymentType === "cod" ? "💵 Cash on Delivery" : "✅ Cash Pay"}</span>
                </div>
              </div>

              {/* Fee Breakdown */}
              <div className="border-t border-gray-100 pt-3 bg-gray-50 rounded-2xl p-3 space-y-1">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Delivery ခ ခွဲချက်</p>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Delivery Fee</span>
                  <span className="font-bold text-primary-500">{deliveryFee.toLocaleString()} ကျပ်</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Commission (10%)</span>
                  <span className="font-semibold text-orange-500">- {commission.toLocaleString()} ကျပ်</span>
                </div>
                <div className="flex justify-between text-xs border-t border-gray-200 pt-1 mt-1">
                  <span className="text-gray-500">Rider ရမည်</span>
                  <span className="font-bold text-green-600">{riderNet.toLocaleString()} ကျပ်</span>
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
            <button onClick={() => setStep(1)} className="flex-1 py-4 rounded-2xl border border-gray-200 font-bold text-gray-500">← ပြန်</button>
            <button onClick={() => setStep(3)} disabled={!itemType || !itemValue || !phone}
              className="flex-[2] btn-primary disabled:opacity-50">ဆက်လက်မည် →</button>
          </div>
        )}
        {step === 3 && (
          <div className="flex gap-3">
            <button onClick={() => setStep(2)} className="flex-1 py-4 rounded-2xl border border-gray-200 font-bold text-gray-500">← ပြန်</button>
            <button onClick={handleSubmit} disabled={loading} className="flex-[2] btn-primary disabled:opacity-50">
              {loading ? "တင်နေသည်..." : `📦 Order တင် (${deliveryFee.toLocaleString()} ကျပ်)`}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
