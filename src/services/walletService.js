// src/services/walletService.js
// Rider Wallet - Coin top-up, Commission နုတ်, Balance ကြည့်

import {
  doc, updateDoc, addDoc, collection,
  serverTimestamp, increment, query,
  where, orderBy, onSnapshot, getDoc
} from "firebase/firestore"
import { db } from "../firebase/config"

const COMMISSION_RATE = 0.10  // 10%
const LOW_BALANCE_THRESHOLD = 1000  // ကျပ် ၁၀၀၀ အောက်ဆိုရင် warning

// ─── Get Rider Balance ────────────────────────
export async function getRiderBalance(riderId) {
  const snap = await getDoc(doc(db, "riders", riderId))
  if (!snap.exists()) return 0
  return snap.data()?.coinBalance ?? 0
}

// ─── Admin Top-up Coin ────────────────────────
export async function adminTopUp(riderId, amount, note = "") {
  try {
    const balanceBefore = await getRiderBalance(riderId)
    const balanceAfter = balanceBefore + amount

    // Rider balance update
    await updateDoc(doc(db, "riders", riderId), {
      coinBalance: increment(amount),
    })

    // Transaction record
    await addDoc(collection(db, "walletTransactions"), {
      riderId,
      type: "topup",
      amount,
      commission: 0,
      netAmount: amount,
      orderId: null,
      note: note || "Admin top-up",
      balanceBefore,
      balanceAfter,
      createdAt: serverTimestamp(),
    })

    return { success: true, balanceAfter }
  } catch (err) {
    console.error("adminTopUp error:", err)
    return { success: false, error: err.message }
  }
}

// ─── Deduct Commission (Delivery တစ်ခုပြီးတိုင်း) ──
export async function deductCommission(riderId, orderId, deliveryAmount) {
  try {
    const commission = Math.round(deliveryAmount * COMMISSION_RATE)
    const netAmount = deliveryAmount - commission
    const balanceBefore = await getRiderBalance(riderId)
    const balanceAfter = balanceBefore - commission

    // Balance check
    if (balanceBefore < commission) {
      return { 
        success: false, 
        error: "Coin မလုံလောက်ပါ", 
        required: commission,
        current: balanceBefore 
      }
    }

    // Rider balance နုတ်
    await updateDoc(doc(db, "riders", riderId), {
      coinBalance:     increment(-commission),
      totalEarned:     increment(deliveryAmount),
      totalCommission: increment(commission),
    })

    // Transaction record
    await addDoc(collection(db, "walletTransactions"), {
      riderId,
      type: "commission",
      amount: deliveryAmount,
      commission,
      netAmount,
      orderId,
      note: `Order #${orderId} - 10% commission`,
      balanceBefore,
      balanceAfter,
      createdAt: serverTimestamp(),
    })

    // Low balance check
    const isLowBalance = balanceAfter < LOW_BALANCE_THRESHOLD

    return { 
      success: true, 
      commission,
      netAmount,
      balanceAfter,
      isLowBalance
    }
  } catch (err) {
    console.error("deductCommission error:", err)
    return { success: false, error: err.message }
  }
}

// ─── Real-time Balance Listener ───────────────
export function listenToRiderBalance(riderId, callback) {
  return onSnapshot(doc(db, "riders", riderId), (snap) => {
    const data = snap.data()
    callback({
      coinBalance:     data?.coinBalance ?? 0,
      totalEarned:     data?.totalEarned ?? 0,
      totalCommission: data?.totalCommission ?? 0,
      isLowBalance:    (data?.coinBalance ?? 0) < LOW_BALANCE_THRESHOLD,
    })
  })
}

// ─── Transaction History ──────────────────────
export function listenToTransactions(riderId, callback) {
  const q = query(
    collection(db, "walletTransactions"),
    where("riderId", "==", riderId),
    orderBy("createdAt", "desc")
  )
  return onSnapshot(q, (snap) => {
    const txs = snap.docs.map(d => ({ id: d.id, ...d.data() }))
    callback(txs)
  })
}

// ─── Admin: All Riders Balance ────────────────
export function listenToAllRidersBalance(callback) {
  return onSnapshot(collection(db, "riders"), (snap) => {
    const riders = snap.docs.map(d => ({
      id: d.id,
      name:            d.data().name,
      coinBalance:     d.data().coinBalance ?? 0,
      totalEarned:     d.data().totalEarned ?? 0,
      totalCommission: d.data().totalCommission ?? 0,
      isLowBalance:    (d.data().coinBalance ?? 0) < LOW_BALANCE_THRESHOLD,
    }))
    callback(riders)
  })
}
