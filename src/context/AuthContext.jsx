// src/context/AuthContext.jsx
import { createContext, useContext, useState } from "react"

const AuthContext = createContext(null)

// Mock users for view-only app
const MOCK_USERS = {
  customer: { uid: "user1", name: "မမသက်", email: "customer@test.com", role: "customer" },
  rider:    { uid: "rider1", name: "ကိုမင်းသန့်", email: "rider@test.com", role: "rider" },
  admin:    { uid: "admin1", name: "Admin", email: "admin@test.com", role: "admin" },
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)

  const login = (role) => {
    setUser(MOCK_USERS[role])
  }

  const logout = () => setUser(null)

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
