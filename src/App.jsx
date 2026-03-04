// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { AuthProvider, useAuth } from "./context/AuthContext"

import Landing        from "./pages/Landing"
import SignUp         from "./pages/auth/SignUp"
import Login          from "./pages/auth/Login"
import AdminLogin     from "./pages/auth/AdminLogin"

import CustomerDashboard  from "./pages/customer/CustomerDashboard"
import CreateOrder        from "./pages/customer/CreateOrder"
import TrackOrder         from "./pages/customer/TrackOrder"
import CustomerHistory    from "./pages/customer/CustomerHistory"
import CustomerProfile    from "./pages/customer/CustomerProfile"

import RiderDashboard  from "./pages/rider/RiderDashboard"
import ActiveDelivery  from "./pages/rider/ActiveDelivery"
import RiderWallet     from "./pages/rider/RiderWallet"
import RiderHistory    from "./pages/rider/RiderHistory"
import RiderPending    from "./pages/rider/RiderPending"

import AdminDashboard  from "./pages/admin/AdminDashboard"
import LiveMap         from "./pages/admin/LiveMap"
import ManageWallet    from "./pages/admin/ManageWallet"

// ── Guard: Rider pending approval ─────────────────
function RiderGuard({ children }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (user.role === "rider" && user.status === "pending") {
    return <Navigate to="/rider/pending" replace />
  }
  return children
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/"                   element={<Landing />} />
          <Route path="/signup"             element={<SignUp />} />
          <Route path="/login"              element={<Login />} />
          <Route path="/gobike-admin-2024"  element={<AdminLogin />} />

          {/* Customer */}
          <Route path="/customer"           element={<CustomerDashboard />} />
          <Route path="/customer/order"     element={<CreateOrder />} />
          <Route path="/customer/track"     element={<TrackOrder />} />
          <Route path="/customer/history"   element={<CustomerHistory />} />
          <Route path="/customer/profile"   element={<CustomerProfile />} />

          {/* Rider — pending screen (no guard needed) */}
          <Route path="/rider/pending"      element={<RiderPending />} />

          {/* Rider — protected by RiderGuard */}
          <Route path="/rider"              element={<RiderGuard><RiderDashboard /></RiderGuard>} />
          <Route path="/rider/delivery"     element={<RiderGuard><ActiveDelivery /></RiderGuard>} />
          <Route path="/rider/wallet"       element={<RiderGuard><RiderWallet /></RiderGuard>} />
          <Route path="/rider/history"      element={<RiderGuard><RiderHistory /></RiderGuard>} />

          {/* Admin */}
          <Route path="/admin"              element={<AdminDashboard />} />
          <Route path="/admin/map"          element={<LiveMap />} />
          <Route path="/admin/wallet"       element={<ManageWallet />} />

          {/* Fallback */}
          <Route path="*"                   element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
