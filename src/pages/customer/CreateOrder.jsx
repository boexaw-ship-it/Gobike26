// src/pages/customer/CreateOrder.jsx
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { collection, addDoc, serverTimestamp } from "firebase/firestore"
import { db } from "../../firebase/config"
import { useAuth } from "../../context/AuthContext"
import Navbar from "../../components/common/Navbar"
import BottomNav from "../../components/common/BottomNav"
import MapView from "../../components/map/MapView"
import Toast from "../../components/common/Toast"

// ─── Yangon Townships ───────────────────────────────
const TOWNSHIPS = [
  { label:"ဗဟန်း",            lat:16.8409, lng:96.1353 },
  { label:"ကမာရွတ်",           lat:16.8500, lng:96.1200 },
  { label:"တာမွေ",             lat:16.8200, lng:96.1600 },
  { label:"ဒဂုံ",               lat:16.8700, lng:96.1900 },
  { label:"မရမ်းကုန်း",         lat:16.8800, lng:96.1100 },
  { label:"စမ်းချောင်း",        lat:16.8600, lng:96.1300 },
  { label:"လှိုင်",              lat:16.8900, lng:96.1500 },
  { label:"သင်္ဃန်းကျွန်း",     lat:16.8100, lng:96.1700 },
  { label:"ဒေါပုံ",              lat:16.7900, lng:96.1800 },
  { label:"မင်္ဂလာဒုံ",          lat:16.9100, lng:96.1600 },
  { label:"ရန်ကင်း",            lat:16.8700, lng:96.1400 },
  { label:"ပုဇွန်တောင်",        lat:16.8300, lng:96.1500 },
  { label:"ကြည့်မြင်တိုင်",     lat:16.8400, lng:96.1250 },
  { label:"အင်းစိန်",            lat:16.9000, lng:96.0900 },
  { label:"မင်္ဂလာတောင်ညွန့်", lat:16.8550, lng:96.1450 },
  { label:"ဆိပ်ကြီးခနောင်တို",  lat:16.7800, lng:96.2100 },
  { label:"သာကေတ",            lat:16.8000, lng:96.1900 },
  { label:"တောင်ဥက္ကလာပ",     lat:16.8300, lng:96.2000 },
  { label:"မြောက်ဥက္ကလာပ",    lat:16.8500, lng:96.2000 },
  { label:"ဒဂုံဆိပ်ကမ်း",        lat:16.8400, lng:96.2200 },
  { label:"လှိုင်သာယာ",          lat:16.9200, lng:96.0700 },
  { label:"ရွှေပြည်သာ",          lat:16.9500, lng:96.0500 },
  { label:"မောင်တောင်",          lat:16.7600, lng:96.1600 },
  { label:"တွံတေး",              lat:17.0300, lng:96.0700 },
  { label:"ကျောက်တံတား",       lat:16.7800, lng:96.1600 },
  { label:"ပုလဲ",                lat:16.7700, lng:96.1700 },
  { label:"ကော်မှူး",            lat:16.7600, lng:96.1900 },
  { label:"လှည်းကူး",            lat:17.0800, lng:96.1700 },
  { label:"ဒိုက်ဦး",              lat:17.1000, lng:96.0800 },
  { label:"တိုက်ကြီး",            lat:17.0500, lng:96.2000 },
]

const ITEM_TYPES = [
  { value:"document",   label:"📄 စာရွက်စာတမ်း" },
  { value:"food",       label:"🍱 အစားအစာ" },
  { value:"clothes",    label:"👗 အဝတ်အထည်" },
  { value:"medicine",   label:"💊 ဆေးဝါး" },
  { value:"electronic", label:"📱 လျှပ်စစ်ပစ္စည်း" },
  { value:"other",      label:"📦 အခြား" },
]

const DELIVERY_RATE = 0.10

const calcDeliveryFee = (pickup, dropoff) => {
  if (!pickup || !dropoff) return 0
  const dist = Math.sqrt(
    Math.pow((pickup.lat - dropoff.lat) * 111, 2) +
    Math.pow((pickup.lng - dropoff.lng) * 111, 2)
  )
  return Math.round(dist * 800 + 1500)
}

async function sendTelegram(order, fees) {
  const BOT  = import.meta.env.VITE_TELEGRAM_BOT_TOKEN
  const CHAT = import.meta.env.VITE_TELEGRAM_ADMIN_CHAT_ID
  if (!BOT || !CHAT) return
  const time = new Date().toLocaleString("en-GB",{
    day:"2-digit",month:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit",hour12:true
  })
  const text = `🆕 <b>Order သစ် ဝင်လာပြီ!</b>
━━━━━━━━━━━━━━━━
📦 <b>Order #${order.id?.slice(-6).toUpperCase()}</b>
⏰ <b>အချိန်:</b> ${time}
━━━━━━━━━━━━━━━━
👤 <b>Customer:</b> ${order.customerName}
📞 <b>ဖုန်း:</b> ${order.customerPhone}
━━━━━━━━━━━━━━━━
📍 <b>ယူမည့်နေရာ:</b>
   🏘️ ${order.pickup?.township} မြို့နယ်
   🏠 ${order.pickup?.detail || "-"}
━━━━━━━━━━━━━━━━
🎯 <b>ပို့မည့်နေရာ:</b>
   🏘️ ${order.dropoff?.township} မြို့နယ်
   🏠 ${order.dropoff?.detail || "-"}
━━━━━━━━━━━━━━━━
🏷️ <b>ပစ္စည်း:</b> ${order.itemTypeLabel}
💎 <b>ပစ္စည်းတန်ဖိုး:</b> ${Number(order.itemValue||0).toLocaleString()} ကျပ်
💳 <b>ငွေပေးချေ:</b> ${order.paymentType==="cod" ? "💵 COD" : "✅ Cash"}
━━━━━━━━━━━━━━━━
🚚 <b>Delivery Fee:</b> ${fees.deliveryFee.toLocaleString()} ကျပ်
💰 <b>Total:</b> ${(Number(order.itemValue||0)+fees.deliveryFee).toLocaleString()} ကျပ်
📊 <b>Commission (10%):</b> ${fees.commission.toLocaleString()} ကျပ်
🏍️ <b>Rider ရမည်:</b> ${fees.riderNet.toLocaleString()} ကျပ်
${order.note ? `📝 <b>မှတ်ချက်:</b> ${order.note}` : ""}`
  await fetch(`https://api.telegram.org/bot${BOT}/sendMessage`,{
    method:"POST", headers:{"Content-Type":"application/json"},
    body: JSON.stringify({ chat_id:CHAT, text, parse_mode:"HTML" }),
  }).catch(()=>{})
}

// ── Location Picker Component ──────────────────────
function LocationPicker({ label, icon, color, value, onChange }) {
  const [township, setTownship]   = useState(value?.township || "")
  const [detail, setDetail]       = useState(value?.detail || "")
  const [open, setOpen]           = useState(false)
  const [search, setSearch]       = useState("")

  const selected = TOWNSHIPS.find(t => t.label === township)

  const handleSelect = (t) => {
    setTownship(t.label)
    setOpen(false)
    setSearch("")
    const loc = { township:t.label, detail, address:`${t.label} မြို့နယ်${detail ? ", "+detail : ""}`, lat:t.lat, lng:t.lng }
    onChange(loc)
  }

  const handleDetailChange = (v) => {
    setDetail(v)
    if (selected) {
      onChange({ township:selected.label, detail:v, address:`${selected.label} မြို့နယ်${v?", "+v:""}`, lat:selected.lat, lng:selected.lng })
    }
  }

  const filtered = TOWNSHIPS.filter(t => t.label.includes(search))

  return (
    <div>
      <p className={`text-xs font-bold mb-2 uppercase tracking-widest ${color}`}>{icon} {label}</p>
      {/* Township selector */}
      <div className="mb-2">
        <button type="button" onClick={() => setOpen(!open)}
          className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl border-2 text-sm font-semibold transition-all
            ${township ? "border-primary-400 bg-primary-50 text-primary-600" : "border-gray-200 bg-gray-50 text-gray-400"}`}>
          <span>{township ? `🏘️ ${township} မြို့နယ်` : "မြို့နယ် ရွေးချယ်ပါ"}</span>
          <span className={`transition-transform ${open ? "rotate-180" : ""}`}>▾</span>
        </button>
        {open && (
          <div className="mt-1 bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden z-20 relative">
            <div className="p-2 border-b border-gray-100">
              <input autoFocus placeholder="ရှာဖွေမည်..." value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl bg-gray-50 focus:outline-none" />
            </div>
            <div className="max-h-48 overflow-y-auto">
              {filtered.map(t => (
                <button key={t.label} type="button" onClick={() => handleSelect(t)}
                  className={`w-full text-left px-4 py-2.5 text-sm hover:bg-primary-50 transition-colors
                    ${township===t.label ? "font-bold text-primary-500 bg-primary-50" : "text-gray-700"}`}>
                  {t.label} မြို့နယ်
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
      {/* Detail address */}
      <input
        placeholder="🏠 တိကျသောလိပ်စာ (ရပ်ကွက်/လမ်း/နံပါတ်)"
        value={detail}
        onChange={e => handleDetailChange(e.target.value)}
        className="w-full px-4 py-3 rounded-2xl border-2 border-gray-200 bg-gray-50 text-sm focus:outline-none focus:border-primary-400 focus:bg-white transition-all"
      />
      {/* Preview */}
      {township && (
        <div className="mt-2 flex items-center gap-2 text-xs text-primary-600 bg-primary-50 rounded-xl px-3 py-2">
          <span>✅</span>
          <span className="font-semibold">{township} မြို့နယ်{detail ? `, ${detail}` : ""}</span>
        </div>
      )}
    </div>
  )
}

export default function CreateOrder() {
  const navigate   = useNavigate()
  const { user }   = useAuth()
  const [step, setStep]           = useState(1)
  const [pickup, setPickup]       = useState(null)
  const [dropoff, setDropoff]     = useState(null)
  const [itemType, setItemType]   = useState("")
  const [itemValue, setItemValue] = useState("")
  const [phone, setPhone]         = useState(user?.phone || "")
  const [paymentType, setPaymentType] = useState("cod")
  const [note, setNote]           = useState("")
  const [loading, setLoading]     = useState(false)
  const [orderId, setOrderId]     = useState(null)
  const [submitted, setSubmitted] = useState(false)
  const [toast, setToast]         = useState(null)

  const showToast = (msg, type="success") => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  const deliveryFee = calcDeliveryFee(pickup, dropoff)
  const commission  = Math.round(deliveryFee * DELIVERY_RATE)
  const riderNet    = deliveryFee - commission
  const total       = Number(itemValue||0) + deliveryFee

  const resetForm = () => {
    setStep(1); setPickup(null); setDropoff(null)
    setItemType(""); setItemValue(""); setNote("")
    setPaymentType("cod"); setSubmitted(false); setOrderId(null)
  }

  const handleSubmit = async () => {
    if (!pickup?.township)  { showToast("Pickup မြို့နယ် ရွေးပါ", "error"); return }
    if (!dropoff?.township) { showToast("Dropoff မြို့နယ် ရွေးပါ", "error"); return }
    setLoading(true)
    try {
      const itemTypeLabel = ITEM_TYPES.find(t => t.value === itemType)?.label || itemType
      const orderData = {
        customerId: user.uid, customerName: user.name, customerPhone: phone,
        itemType, itemTypeLabel, itemValue: Number(itemValue),
        pickup:  { township:pickup.township, detail:pickup.detail||"", address:pickup.address, lat:pickup.lat,  lng:pickup.lng  },
        dropoff: { township:dropoff.township, detail:dropoff.detail||"", address:dropoff.address, lat:dropoff.lat, lng:dropoff.lng },
        deliveryFee, commission, riderNet, total, paymentType, note,
        status:"pending", riderId:null, riderName:null,
        createdAt:serverTimestamp(), updatedAt:serverTimestamp(),
      }
      const docRef = await addDoc(collection(db,"orders"), orderData)
      setOrderId(docRef.id)
      await sendTelegram({ ...orderData, id:docRef.id }, { deliveryFee, commission, riderNet })
      setSubmitted(true)
    } catch {
      showToast("Order တင်ရာ Error ဖြစ်သည်", "error")
    } finally { setLoading(false) }
  }

  // ── Submitted screen ──
  if (submitted) {
    return (
      <div className="min-h-screen bg-surface flex flex-col items-center justify-center px-6">
        <div className="text-6xl mb-4 animate-bounce">🎉</div>
        <h2 className="text-2xl font-display font-black text-dark mb-2">Order တင်ပြီးပြီ!</h2>
        <p className="text-gray-400 text-sm mb-1">Order #{orderId?.slice(-6).toUpperCase()}</p>
        <p className="text-gray-400 text-xs mb-8">Rider ရှာနေသည်... ခဏစောင့်ပါ 🏍️</p>
        <div className="w-full max-w-sm bg-white rounded-3xl p-4 shadow-card mb-6 space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-gray-400">📍 Pickup</span>
            <span className="font-semibold text-right max-w-[60%]">{pickup?.address}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-gray-400">🎯 Dropoff</span>
            <span className="font-semibold text-right max-w-[60%]">{dropoff?.address}</span>
          </div>
          <div className="flex justify-between text-xs border-t pt-2">
            <span className="text-gray-400">💰 Total</span>
            <span className="font-display font-black text-primary-500">{total.toLocaleString()} ကျပ်</span>
          </div>
        </div>
        <div className="flex gap-3 w-full max-w-sm">
          <button onClick={resetForm} className="flex-1 py-4 rounded-2xl border border-gray-200 font-bold text-gray-600 text-sm">
            ➕ ထပ်တင်မည်
          </button>
          <button onClick={() => navigate("/customer/track")} className="flex-[2] btn-primary text-sm">
            📍 Track Order
          </button>
        </div>
      </div>
    )
  }

  const step1Valid = pickup?.township && dropoff?.township
  const step2Valid = itemType && itemValue && phone

  return (
    <div className="flex flex-col h-screen bg-surface">
      <Navbar title="Order တင်မည်" />
      {toast && <Toast message={toast.msg} type={toast.type} />}
      <div className="flex-1 overflow-y-auto pb-32">

        {/* Progress */}
        <div className="px-4 pt-4 pb-3 bg-white border-b border-gray-100 sticky top-0 z-10">
          <div className="flex items-center">
            {[1,2,3].map(s => (
              <div key={s} className="flex items-center flex-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black border-2 transition-all
                  ${step >= s ? "bg-primary-500 border-primary-500 text-white" : "bg-white border-gray-200 text-gray-400"}`}>
                  {step > s ? "✓" : s}
                </div>
                {s < 3 && <div className={`flex-1 h-1 mx-1 rounded transition-all ${step > s ? "bg-primary-500" : "bg-gray-200"}`} />}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-1 px-0.5">
            {["နေရာ","အချက်အလက်","အတည်ပြု"].map(s => (
              <span key={s} className="text-[9px] text-gray-400">{s}</span>
            ))}
          </div>
        </div>

        {/* Map preview */}
        {(pickup || dropoff) && (
          <div className="px-4 pt-4">
            <div className="h-40 rounded-3xl overflow-hidden shadow-card">
              <MapView pickupPoint={pickup} dropoffPoint={dropoff} height="100%" />
            </div>
            {pickup && dropoff && (
              <div className="flex items-center justify-center gap-2 mt-2">
                <span className="text-xs text-gray-400">📏 ~{(calcDeliveryFee(pickup,dropoff)/800).toFixed(1)} km</span>
                <span className="text-gray-300">·</span>
                <span className="text-xs font-bold text-primary-500">🚚 {deliveryFee.toLocaleString()} ကျပ်</span>
              </div>
            )}
          </div>
        )}

        {/* ── Step 1: Locations ── */}
        {step === 1 && (
          <div className="px-4 pt-4 space-y-5">
            <LocationPicker
              label="ယူမည့်နေရာ (Pickup)"
              icon="📦" color="text-green-600"
              value={pickup}
              onChange={setPickup}
            />
            <div className="border-t border-dashed border-gray-200" />
            <LocationPicker
              label="ပို့မည့်နေရာ (Dropoff)"
              icon="🎯" color="text-red-500"
              value={dropoff}
              onChange={setDropoff}
            />
          </div>
        )}

        {/* ── Step 2: Details ── */}
        {step === 2 && (
          <div className="px-4 pt-4 space-y-4">
            <div>
              <label className="text-xs font-bold text-gray-500 mb-2 block uppercase tracking-widest">📦 ပစ္စည်းအမျိုးအစား</label>
              <div className="grid grid-cols-2 gap-2">
                {ITEM_TYPES.map(t => (
                  <button key={t.value} type="button" onClick={() => setItemType(t.value)}
                    className={`card text-sm py-3 text-center active:scale-[0.98] transition-all font-semibold
                      ${itemType===t.value ? "border-2 border-primary-500 bg-primary-50 text-primary-600" : ""}`}>
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 mb-1 block uppercase tracking-widest">💎 ပစ္စည်းတန်ဖိုး (ကျပ်)</label>
              <input type="number" placeholder="ဥပမာ 50000" value={itemValue}
                onChange={e => setItemValue(e.target.value)}
                className="w-full bg-gray-50 border-2 border-gray-200 rounded-2xl px-4 py-3 text-sm font-semibold focus:outline-none focus:border-primary-400 focus:bg-white transition-all" />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 mb-1 block uppercase tracking-widest">📞 ဆက်သွယ်ရန်ဖုန်း</label>
              <input type="tel" placeholder="09xxxxxxxx" value={phone}
                onChange={e => setPhone(e.target.value)}
                className="w-full bg-gray-50 border-2 border-gray-200 rounded-2xl px-4 py-3 text-sm font-semibold focus:outline-none focus:border-primary-400 focus:bg-white transition-all" />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 mb-2 block uppercase tracking-widest">💳 ငွေပေးချေမှု</label>
              <div className="grid grid-cols-2 gap-2">
                {[["cod","💵 COD"],["cash","✅ Cash Pay"]].map(([v,l]) => (
                  <button key={v} type="button" onClick={() => setPaymentType(v)}
                    className={`card py-3 text-sm font-bold text-center active:scale-[0.98] transition-all
                      ${paymentType===v ? "border-2 border-primary-500 bg-primary-50 text-primary-600" : ""}`}>
                    {l}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 mb-1 block uppercase tracking-widest">📝 မှတ်ချက် (Optional)</label>
              <textarea rows={2} placeholder="မှတ်ချက်ရှိလျှင် ထည့်ပါ" value={note}
                onChange={e => setNote(e.target.value)}
                className="w-full bg-gray-50 border-2 border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-primary-400 focus:bg-white transition-all resize-none" />
            </div>
          </div>
        )}

        {/* ── Step 3: Confirm ── */}
        {step === 3 && (
          <div className="px-4 pt-4">
            <div className="card space-y-3 mb-4">
              {/* Route */}
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center shrink-0">📦</div>
                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider">ယူမည့်နေရာ</p>
                  <p className="text-sm font-bold text-dark">{pickup?.township} မြို့နယ်</p>
                  {pickup?.detail && <p className="text-xs text-gray-500">{pickup.detail}</p>}
                </div>
              </div>
              <div className="w-px h-4 bg-gray-200 ml-4" />
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center shrink-0">🎯</div>
                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider">ပို့မည့်နေရာ</p>
                  <p className="text-sm font-bold text-dark">{dropoff?.township} မြို့နယ်</p>
                  {dropoff?.detail && <p className="text-xs text-gray-500">{dropoff.detail}</p>}
                </div>
              </div>
              <div className="border-t border-gray-100 pt-3 space-y-1.5">
                {[
                  ["ပစ္စည်းအမျိုး", ITEM_TYPES.find(t=>t.value===itemType)?.label],
                  ["ပစ္စည်းတန်ဖိုး", `${Number(itemValue).toLocaleString()} ကျပ်`],
                  ["ဖုန်းနံပါတ်", phone],
                  ["ငွေပေးချေ", paymentType==="cod" ? "💵 Cash on Delivery" : "✅ Cash Pay"],
                  ...(note ? [["မှတ်ချက်", note]] : []),
                ].map(([k,v]) => (
                  <div key={k} className="flex justify-between text-xs">
                    <span className="text-gray-400">{k}</span>
                    <span className="font-semibold text-right max-w-[60%]">{v}</span>
                  </div>
                ))}
              </div>
              {/* Fee */}
              <div className="bg-gray-50 rounded-2xl p-3 space-y-1.5">
                <div className="flex justify-between text-xs"><span className="text-gray-500">💎 ပစ္စည်းတန်ဖိုး</span><span className="font-semibold">{Number(itemValue).toLocaleString()} ကျပ်</span></div>
                <div className="flex justify-between text-xs"><span className="text-gray-500">🚚 Delivery Fee</span><span className="font-semibold">{deliveryFee.toLocaleString()} ကျပ်</span></div>
                <div className="flex justify-between text-sm border-t pt-1.5">
                  <span className="font-black text-dark">💰 Total</span>
                  <span className="font-display font-black text-primary-500">{total.toLocaleString()} ကျပ်</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Bottom Buttons ── */}
      <div className="fixed bottom-16 left-0 right-0 bg-white border-t border-gray-100 px-4 pt-3 pb-3">
        {step === 1 && (
          <button onClick={() => setStep(2)} disabled={!step1Valid}
            className="btn-primary disabled:opacity-40">
            ဆက်လက်မည် →
          </button>
        )}
        {step === 2 && (
          <div className="flex gap-3">
            <button onClick={() => setStep(1)} className="flex-1 py-4 rounded-2xl border-2 border-gray-200 font-bold text-gray-500">← ပြန်</button>
            <button onClick={() => setStep(3)} disabled={!step2Valid}
              className="flex-[2] btn-primary disabled:opacity-40">ဆက်လက်မည် →</button>
          </div>
        )}
        {step === 3 && (
          <div className="flex gap-3">
            <button onClick={() => setStep(2)} className="flex-1 py-4 rounded-2xl border-2 border-gray-200 font-bold text-gray-500">← ပြန်</button>
            <button onClick={handleSubmit} disabled={loading}
              className="flex-[2] btn-primary disabled:opacity-40">
              {loading ? "တင်နေသည်..." : `📦 Order တင် — ${total.toLocaleString()} ကျပ်`}
            </button>
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  )
}
