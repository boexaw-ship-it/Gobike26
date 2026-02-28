// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { AuthProvider } from "./context/AuthContext"

import Landing from "./pages/Landing"
import SignUp from "./pages/auth/SignUp"
import Login from "./pages/auth/Login"
import CustomerDashboard from "./pages/customer/CustomerDashboard"
import CreateOrder from "./pages/customer/CreateOrder"
import TrackOrder from "./pages/customer/TrackOrder"
import RiderDashboard from "./pages/rider/RiderDashboard"
import ActiveDelivery from "./pages/rider/ActiveDelivery"
import AdminDashboard from "./pages/admin/AdminDashboard"
import LiveMap from "./pages/admin/LiveMap"

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/" element={<Landing />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/login" element={<Login />} />

          {/* Customer */}
          <Route path="/customer" element={<CustomerDashboard />} />
          <Route path="/customer/order" element={<CreateOrder />} />
          <Route path="/customer/track" element={<TrackOrder />} />

          {/* Rider */}
          <Route path="/rider" element={<RiderDashboard />} />
          <Route path="/rider/delivery" element={<ActiveDelivery />} />

          {/* Admin */}
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/map" element={<LiveMap />} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
