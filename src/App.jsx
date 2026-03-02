// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { AuthProvider } from "./context/AuthContext"

import Landing    from "./pages/Landing"
import SignUp     from "./pages/auth/SignUp"
import Login      from "./pages/auth/Login"
import AdminLogin from "./pages/auth/AdminLogin"

import CustomerDashboard from "./pages/customer/CustomerDashboard"
import CreateOrder       from "./pages/customer/CreateOrder"
import TrackOrder        from "./pages/customer/TrackOrder"
import CustomerHistory   from "./pages/customer/CustomerHistory"
import CustomerProfile   from "./pages/customer/CustomerProfile"

import RiderDashboard  from "./pages/rider/RiderDashboard"
import ActiveDelivery  from "./pages/rider/ActiveDelivery"
import RiderWallet     from "./pages/rider/RiderWallet"
import RiderHistory    from "./pages/rider/RiderHistory"
import RiderProfile    from "./pages/rider/RiderProfile"

import AdminDashboard from "./pages/admin/AdminDashboard"
import LiveMap        from "./pages/admin/LiveMap"
import ManageWallet   from "./pages/admin/ManageWallet"

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter basename="/Gobike26">
        <Routes>
          <Route path="/"                    element={<Landing />} />
          <Route path="/signup"              element={<SignUp />} />
          <Route path="/login"               element={<Login />} />
          <Route path="/gobike-admin-2024"   element={<AdminLogin />} />

          <Route path="/customer"            element={<CustomerDashboard />} />
          <Route path="/customer/order"      element={<CreateOrder />} />
          <Route path="/customer/track"      element={<TrackOrder />} />
          <Route path="/customer/history"    element={<CustomerHistory />} />
          <Route path="/customer/profile"    element={<CustomerProfile />} />

          <Route path="/rider"               element={<RiderDashboard />} />
          <Route path="/rider/delivery"      element={<ActiveDelivery />} />
          <Route path="/rider/wallet"        element={<RiderWallet />} />
          <Route path="/rider/history"       element={<RiderHistory />} />
          <Route path="/rider/profile"       element={<RiderProfile />} />

          <Route path="/admin"               element={<AdminDashboard />} />
          <Route path="/admin/map"           element={<LiveMap />} />
          <Route path="/admin/wallet"        element={<ManageWallet />} />

          <Route path="*"                    element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
