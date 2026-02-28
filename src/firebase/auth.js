// src/firebase/auth.js
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "firebase/auth"
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore"
import { auth, db } from "./config"

// ─── Sign Up ──────────────────────────────────
export async function signUp({ name, email, phone, password, role }) {
  const { user } = await createUserWithEmailAndPassword(auth, email, password)

  // Firestore users collection
  await setDoc(doc(db, "users", user.uid), {
    name, email, phone, role,
    status: "active",
    createdAt: serverTimestamp(),
  })

  // Rider extra doc
  if (role === "rider") {
    await setDoc(doc(db, "riders", user.uid), {
      name, phone,
      isOnline: false,
      isAvailable: false,
      currentLocation: null,
      rating: 5.0,
      totalDeliveries: 0,
      telegramChatId: null,   // ← Rider ကိုယ်တိုင် bot နဲ့ link လုပ်ရမည်
      vehicleType: "bike",
      lastUpdated: serverTimestamp(),
    })
  }

  return user
}

// ─── Login ────────────────────────────────────
export async function login(email, password) {
  const { user } = await signInWithEmailAndPassword(auth, email, password)
  const snap = await getDoc(doc(db, "users", user.uid))
  const userData = snap.data()
  return { uid: user.uid, ...userData }
}

// ─── Logout ───────────────────────────────────
export async function logout() {
  await signOut(auth)
}

// ─── Auth State Listener ──────────────────────
export function onAuthChange(callback) {
  return onAuthStateChanged(auth, async (user) => {
    if (!user) return callback(null)
    const snap = await getDoc(doc(db, "users", user.uid))
    callback({ uid: user.uid, ...snap.data() })
  })
}
