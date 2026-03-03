// src/services/notificationService.js
import { addDoc, collection, serverTimestamp } from "firebase/firestore"
import { db } from "../firebase/config"

// Send notification to a user
export async function sendNotification(userId, { title, message, type, orderId }) {
  try {
    await addDoc(collection(db, "notifications"), {
      userId,
      title,
      message,
      type,
      orderId: orderId || null,
      isRead:  false,
      createdAt: serverTimestamp(),
    })
  } catch (e) {
    console.error("sendNotification error:", e)
  }
}

// Called when rider accepts order
export async function notifyOrderAccepted(order) {
  // Notify customer
  await sendNotification(order.customerId, {
    title:   `🏍️ Rider ${order.riderName} လက်ခံပြီ`,
    message: `${order.pickup?.address} → ${order.dropoff?.address}`,
    type:    "accepted",
    orderId: order.id,
  })
}

// Called when rider picks up
export async function notifyPickedUp(order) {
  await sendNotification(order.customerId, {
    title:   `📦 ပစ္စည်းယူပြီ — သယ်ဆောင်နေသည်`,
    message: `Order #${order.id?.slice(-6).toUpperCase()} — ${order.dropoff?.address} ဆီသို့`,
    type:    "picked_up",
    orderId: order.id,
  })
}

// Called when delivered
export async function notifyDelivered(order) {
  // Notify customer
  await sendNotification(order.customerId, {
    title:   `✅ Order ရောက်ပြီ!`,
    message: `Order #${order.id?.slice(-6).toUpperCase()} — ${order.dropoff?.address}`,
    type:    "delivered",
    orderId: order.id,
  })
  // Notify rider
  await sendNotification(order.riderId, {
    title:   `🎉 Delivery ပြီး! ${Number(order.riderNet||0).toLocaleString()} ကျပ် ရရှိသည်`,
    message: `Commission (10%): ${Number(order.commission||0).toLocaleString()} ကျပ် နုတ်ပြီ`,
    type:    "delivered",
    orderId: order.id,
  })
}

// Called when new order created (for all online riders)
export async function notifyNewOrder(order, riderIds) {
  for (const riderId of riderIds) {
    await sendNotification(riderId, {
      title:   `📦 Order သစ် ဝင်လာပြီ!`,
      message: `${order.pickup?.address} → ${order.dropoff?.address} | ${Number(order.deliveryFee||0).toLocaleString()} ကျပ်`,
      type:    "new_order",
      orderId: order.id,
    })
  }
}
