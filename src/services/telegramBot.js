// src/services/telegramBot.js
// ─────────────────────────────────────────────
// Gobike Telegram Bot Service
// - Rider တွေကို Order notification ပို့
// - Admin ကို Alert ပို့
// ─────────────────────────────────────────────

const BOT_TOKEN = import.meta.env.VITE_TELEGRAM_BOT_TOKEN
const ADMIN_CHAT_ID = import.meta.env.VITE_TELEGRAM_ADMIN_CHAT_ID

const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}`

// ─── Base sender ──────────────────────────────
async function sendMessage(chatId, text, options = {}) {
  try {
    const res = await fetch(`${TELEGRAM_API}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "HTML",
        ...options,
      }),
    })
    const data = await res.json()
    if (!data.ok) throw new Error(data.description)
    return data
  } catch (err) {
    console.error("Telegram sendMessage error:", err)
    return null
  }
}

// ─────────────────────────────────────────────
// 🏍️ RIDER NOTIFICATIONS
// ─────────────────────────────────────────────

/**
 * Rider ကို New Order notification ပို့
 * @param {string} riderChatId - Rider ရဲ့ Telegram chat ID
 * @param {object} order - Order object
 */
export async function notifyRiderNewOrder(riderChatId, order) {
  const text = `
🔔 <b>အော်ဒါသစ် ရောက်ပြီ!</b>

📦 <b>Order #${order.id}</b>
━━━━━━━━━━━━━━━━
📍 <b>Pickup:</b> ${order.pickup.address}
🎯 <b>Dropoff:</b> ${order.dropoff.address}
📏 <b>Distance:</b> ${order.distance} km
💰 <b>Amount:</b> ${order.price.toLocaleString()} ကျပ်
${order.note ? `📝 <b>မှတ်ချက်:</b> ${order.note}` : ""}
━━━━━━━━━━━━━━━━
⏰ <b>Time:</b> ${new Date().toLocaleTimeString("my-MM")}

လက်ခံမည်ဆိုရင် App မှာ Accept နှိပ်ပါ 👇
  `.trim()

  return await sendMessage(riderChatId, text, {
    reply_markup: {
      inline_keyboard: [[
        { text: "✅ App မှာ ဖွင့်မည်", url: "https://gobike.mm/rider" },
      ]]
    }
  })
}

/**
 * Rider ကို Order accept confirm ပို့
 */
export async function notifyRiderOrderAccepted(riderChatId, order) {
  const text = `
✅ <b>Order လက်ခံပြီ!</b>

📦 <b>Order #${order.id}</b>
📍 Pickup: ${order.pickup.address}
🎯 Dropoff: ${order.dropoff.address}
💰 ${order.price.toLocaleString()} ကျပ်

မြန်မြန် သွားယူပေးပါ 🚴‍♂️
  `.trim()

  return await sendMessage(riderChatId, text)
}

/**
 * Rider ကို Order cancel notification ပို့
 */
export async function notifyRiderOrderCancelled(riderChatId, order) {
  const text = `
❌ <b>Order ပယ်ဖျက်ခံရပြီ</b>

📦 Order #${order.id} ကို Customer မှ ပယ်ဖျက်လိုက်ပါသည်။
ထပ်မံ အော်ဒါစောင့်ပါ 🙏
  `.trim()

  return await sendMessage(riderChatId, text)
}

/**
 * Rider ကို Daily summary ပို့ (end of day)
 */
export async function notifyRiderDailySummary(riderChatId, stats) {
  const text = `
📊 <b>ယနေ့ Summary</b>
━━━━━━━━━━━━━━━━
📦 Orders: <b>${stats.totalOrders}</b>
✅ Completed: <b>${stats.completed}</b>
❌ Cancelled: <b>${stats.cancelled}</b>
💰 Total Earned: <b>${stats.totalEarned.toLocaleString()} ကျပ်</b>
⭐ Rating: <b>${stats.rating}</b>
━━━━━━━━━━━━━━━━
ကောင်းကောင်းနားပါ! မနက်ဖြန် ထပ်တွေ့မယ် 🌙
  `.trim()

  return await sendMessage(riderChatId, text)
}

// ─────────────────────────────────────────────
// ⚙️ ADMIN ALERTS
// ─────────────────────────────────────────────

/**
 * Admin ကို New Order alert ပို့
 */
export async function alertAdminNewOrder(order) {
  const text = `
🆕 <b>Order သစ် ဝင်လာပြီ!</b>

📦 <b>Order #${order.id}</b>
━━━━━━━━━━━━━━━━
👤 Customer: ${order.customerId}
📍 From: ${order.pickup.address}
🎯 To: ${order.dropoff.address}
💰 Price: ${order.price.toLocaleString()} ကျပ်
📏 Distance: ${order.distance} km
⏰ Time: ${new Date().toLocaleString("my-MM")}
━━━━━━━━━━━━━━━━
🔍 Status: <b>Pending - Rider မရှိသေးပါ</b>
  `.trim()

  return await sendMessage(ADMIN_CHAT_ID, text, {
    reply_markup: {
      inline_keyboard: [[
        { text: "📊 Dashboard ကြည့်မည်", url: "https://gobike.mm/admin" },
      ]]
    }
  })
}

/**
 * Admin ကို Rider offline alert ပို့
 */
export async function alertAdminRiderOffline(rider) {
  const text = `
⚠️ <b>Rider Offline ဖြစ်သွားပြီ</b>

🏍️ Rider: <b>${rider.name}</b>
📞 Phone: ${rider.phone}
⏰ Time: ${new Date().toLocaleString("my-MM")}

Online Riders လျော့နည်းနေပါသည်!
  `.trim()

  return await sendMessage(ADMIN_CHAT_ID, text)
}

/**
 * Admin ကို Order ကြာနေသည် alert ပို့ (15 min မရ)
 */
export async function alertAdminOrderUnassigned(order) {
  const minutesWaiting = Math.floor((Date.now() - order.createdAt) / 60000)
  const text = `
🚨 <b>Order Rider မရသေးပါ!</b>

📦 Order #${order.id}
⏳ စောင့်ချိန်: <b>${minutesWaiting} မိနစ်</b>
📍 From: ${order.pickup.address}
🎯 To: ${order.dropoff.address}
💰 ${order.price.toLocaleString()} ကျပ်

<b>အမြန် Rider ရှာပေးပါ!</b> 🆘
  `.trim()

  return await sendMessage(ADMIN_CHAT_ID, text, {
    reply_markup: {
      inline_keyboard: [[
        { text: "🗺️ Live Map ကြည့်", url: "https://gobike.mm/admin/map" },
        { text: "📦 Orders ကြည့်", url: "https://gobike.mm/admin/orders" },
      ]]
    }
  })
}

/**
 * Admin ကို Order delivered success alert
 */
export async function alertAdminOrderDelivered(order) {
  const text = `
✅ <b>Delivery အောင်မြင်ပြီ!</b>

📦 Order #${order.id}
🏍️ Rider: ${order.riderId}
💰 Amount: ${order.price.toLocaleString()} ကျပ်
⏰ Delivered: ${new Date().toLocaleString("my-MM")}
  `.trim()

  return await sendMessage(ADMIN_CHAT_ID, text)
}

/**
 * Admin ကို Order cancelled alert
 */
export async function alertAdminOrderCancelled(order, reason = "") {
  const text = `
❌ <b>Order ပယ်ဖျက်ခံရပြီ</b>

📦 Order #${order.id}
💰 Amount: ${order.price.toLocaleString()} ကျပ်
${reason ? `📝 Reason: ${reason}` : ""}
⏰ Time: ${new Date().toLocaleString("my-MM")}
  `.trim()

  return await sendMessage(ADMIN_CHAT_ID, text)
}

/**
 * Admin ကို Daily Report ပို့
 */
export async function alertAdminDailyReport(stats) {
  const text = `
📈 <b>Gobike - Daily Report</b>
📅 ${new Date().toLocaleDateString("my-MM")}
━━━━━━━━━━━━━━━━
📦 Total Orders:    <b>${stats.totalOrders}</b>
✅ Delivered:       <b>${stats.delivered}</b>
❌ Cancelled:       <b>${stats.cancelled}</b>
🏍️ Active Riders:  <b>${stats.activeRiders}</b>
💰 Revenue:        <b>${stats.revenue.toLocaleString()} ကျပ်</b>
━━━━━━━━━━━━━━━━
📊 Success Rate: <b>${Math.round((stats.delivered / stats.totalOrders) * 100)}%</b>
  `.trim()

  return await sendMessage(ADMIN_CHAT_ID, text)
}
