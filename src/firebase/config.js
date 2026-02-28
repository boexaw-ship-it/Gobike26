// src/firebase/config.js
import { initializeApp } from "firebase/app"
import { getAuth } from "firebase/auth"
import { getFirestore } from "firebase/firestore"

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
}

const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const db   = getFirestore(app)
```

---

## Flow
```
GitHub Secrets (သော့ပိတ်သိမ်း 🔒)
         ↓
deploy.yml မှာ ခေါ်သုံး
         ↓
Build အချိန် .env အဖြစ် inject
         ↓
config.js မှာ import.meta.env နဲ့ ဖတ်
         ↓
Firebase ချိတ် ✅
