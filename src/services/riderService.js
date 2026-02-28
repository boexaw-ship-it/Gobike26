// src/services/riderService.js
// Rider location update + online/offline + Telegram

import {
  doc, updateDoc, serverTimestamp,
  collection, onSnapshot, query, where
} from "firebase/firestore"
import { db } from "../firebase/config"
import { alertAdminRiderOffline } from "./telegramBot"

// ─── Update Rider Location (GPS) ──────────────
export async function updateRiderLocation(riderId, lat, lng) {
  try {
    await updateDoc(doc(db, "riders", riderId), {
      currentLocation: { lat, lng },
      "currentLocation.updatedAt": serverTimestamp(),
    })
    return { success: true }
  } catch (err) {
    console.error("updateRiderLocation error:", err)
    return { success: false }
  }
}

// ─── Set Rider Online/Offline ─────────────────
export async function setRiderOnlineStatus(riderId, isOnline, riderData = {}) {
  try {
    await updateDoc(doc(db, "riders", riderId), {
      isOnline,
      isAvailable: isOnline,
      lastUpdated: serverTimestamp(),
    })

    // Offline ဖြစ်ရင် Admin ကို alert
    if (!isOnline && riderData?.name) {
      await alertAdminRiderOffline(riderData)
    }

    return { success: true }
  } catch (err) {
    console.error("setRiderOnlineStatus error:", err)
    return { success: false }
  }
}

// ─── Real-time Online Riders ──────────────────
export function listenToOnlineRiders(callback) {
  const q = query(
    collection(db, "riders"),
    where("isOnline", "==", true)
  )
  return onSnapshot(q, (snapshot) => {
    const riders = snapshot.docs.map(d => ({ id: d.id, ...d.data() }))
    callback(riders)
  })
}
