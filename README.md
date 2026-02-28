# 🚴 Gobike - Delivery Service App

Grab-style delivery platform for Myanmar, built with React + Leaflet + Firebase.

## 🛠 Tech Stack

- **React 18** + Vite
- **Tailwind CSS** (custom orange theme)
- **React Leaflet** + OpenStreetMap (Free map)
- **Firebase** (Auth + Firestore) — ready to connect
- **PWA** manifest included

## 👤 Roles

| Role | Description |
|------|-------------|
| 🛍️ Customer | Order & Track delivery |
| 🏍️ Rider | Accept & Deliver orders |
| ⚙️ Admin | Monitor riders & orders |

## 🚀 Setup

```bash
npm install
npm run dev
```

## 📁 Structure

```
src/
├── pages/
│   ├── Landing.jsx
│   ├── auth/          (SignUp, Login)
│   ├── customer/      (Dashboard, CreateOrder, TrackOrder)
│   ├── rider/         (Dashboard, ActiveDelivery)
│   └── admin/         (Dashboard, LiveMap)
├── components/
│   ├── common/        (Navbar, BottomNav, NotificationBell)
│   ├── map/           (MapView)
│   └── ui/            (OrderCard)
├── context/           (AuthContext)
├── data/              (mockOrders, mockRiders, mockNotifications)
└── constants/         (roles, orderStatus, mapConfig)
```

## 🔥 Firebase Setup

1. Create project at [console.firebase.google.com](https://console.firebase.google.com)
2. Copy config to `src/firebase/config.js`
3. Enable **Authentication** (Email/Password)
4. Enable **Firestore Database**

## 📱 PWA

App installs on Android/iOS via browser → "Add to Home Screen"

---

Made with ❤️ for Myanmar Delivery 🇲🇲
