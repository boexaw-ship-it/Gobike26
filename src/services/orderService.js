// src/services/orderService.js
// Order create/update လုပ်တိုင်း Telegram notification ပါ ပို့မည်

import {
  collection, addDoc, updateDoc, doc,
  serverTimestamp, query, where, onSnapshot, orderBy
} from "firebase/firestore"
import { db } from "../firebase/config"
import {
  alertAdminNewOrder,
  alertAdminOrderDelivered,
  alertAdminOrderCancelled,
  alertAdminOrderUnassigned,
  notifyRiderNewOrder,
  notifyRiderOrderCancelled,
} from "./telegramBot"

const ORDERS_REF = collection(db, "orders")

// ─── Create Order ─────────────────────────────
export async function createOrder(orderData) {
  try {
    const newOrder = {
      ...orderData,
      status: "pending",
      riderId: null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }

    const docRef = await addDoc(ORDERS_REF, newOrder)
    const order = { id: docRef.id, ...newOrder }

    // ✅ Admin ကို alert ပို့
    await alertAdminNewOrder(order)

    // ⏰ 15 min ကြာရင် unassigned alert
    setTimeout(async () => {
      const currentOrder = await getOrderById(docRef.id)
      if (currentOrder?.status === "pending") {
        await alertAdminOrderUnassigned(currentOrder)
      }
    }, 15 * 60 * 1000)

    return { success: true, orderId: docRef.id }
  } catch (err) {
    console.error("createOrder error:", err)
    return { success: false, error: err.message }
  }
}

// ─── Rider Accept Order ───────────────────────
export async function acceptOrder(orderId, riderId, riderTelegramChatId) {
  try {
    await updateDoc(doc(db, "orders", orderId), {
      riderId,
      status: "accepted",
      updatedAt: serverTimestamp(),
    })

    // Rider ကို confirm ပို့
    if (riderTelegramChatId) {
      const order = await getOrderById(orderId)
      await notifyRiderNewOrder(riderTelegramChatId, order)
    }

    return { success: true }
  } catch (err) {
    console.error("acceptOrder error:", err)
    return { success: false, error: err.message }
  }
}

// ─── Update Order Status ──────────────────────
export async function updateOrderStatus(orderId, status, extraData = {}) {
  try {
    await updateDoc(doc(db, "orders", orderId), {
      status,
      updatedAt: serverTimestamp(),
      ...extraData,
    })

    const order = await getOrderById(orderId)

    // Status အလိုက် Telegram notification
    if (status === "delivered") {
      await alertAdminOrderDelivered(order)
    }

    return { success: true }
  } catch (err) {
    console.error("updateOrderStatus error:", err)
    return { success: false, error: err.message }
  }
}

// ─── Cancel Order ─────────────────────────────
export async function cancelOrder(orderId, reason = "", riderTelegramChatId = null) {
  try {
    const order = await getOrderById(orderId)

    await updateDoc(doc(db, "orders", orderId), {
      status: "cancelled",
      cancelReason: reason,
      updatedAt: serverTimestamp(),
    })

    // Admin + Rider ကို notify
    await alertAdminOrderCancelled(order, reason)
    if (riderTelegramChatId) {
      await notifyRiderOrderCancelled(riderTelegramChatId, order)
    }

    return { success: true }
  } catch (err) {
    console.error("cancelOrder error:", err)
    return { success: false, error: err.message }
  }
}

// ─── Get Order by ID ──────────────────────────
export async function getOrderById(orderId) {
  const { getDoc } = await import("firebase/firestore")
  const snap = await getDoc(doc(db, "orders", orderId))
  if (!snap.exists()) return null
  return { id: snap.id, ...snap.data() }
}

// ─── Real-time Orders Listener ────────────────
export function listenToOrders(filters = {}, callback) {
  let q = query(ORDERS_REF, orderBy("createdAt", "desc"))

  if (filters.status) {
    q = query(ORDERS_REF, where("status", "==", filters.status), orderBy("createdAt", "desc"))
  }
  if (filters.riderId) {
    q = query(ORDERS_REF, where("riderId", "==", filters.riderId), orderBy("createdAt", "desc"))
  }
  if (filters.customerId) {
    q = query(ORDERS_REF, where("customerId", "==", filters.customerId), orderBy("createdAt", "desc"))
  }

  return onSnapshot(q, (snapshot) => {
    const orders = snapshot.docs.map(d => ({ id: d.id, ...d.data() }))
    callback(orders)
  })
}

// ─── Listen Pending Orders for Riders ─────────
export function listenToPendingOrders(callback) {
  const q = query(
    ORDERS_REF,
    where("status", "==", "pending"),
    orderBy("createdAt", "desc")
  )
  return onSnapshot(q, (snapshot) => {
    const orders = snapshot.docs.map(d => ({ id: d.id, ...d.data() }))
    callback(orders)
  })
}
