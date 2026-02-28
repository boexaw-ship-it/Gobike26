// src/hooks/useLocation.js
// Rider GPS location ကို real-time track ပြီး Firestore update

import { useState, useEffect, useRef } from "react"
import { updateRiderLocation } from "../services/riderService"

export function useLocation(riderId, enabled = true) {
  const [location, setLocation] = useState(null)
  const [error, setError] = useState(null)
  const watchIdRef = useRef(null)

  useEffect(() => {
    if (!enabled || !riderId) return

    if (!navigator.geolocation) {
      setError("Geolocation ကို ဤ browser မထောက်ပံ့ပါ")
      return
    }

    // GPS watch start
    watchIdRef.current = navigator.geolocation.watchPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords
        setLocation({ lat, lng })

        // Firestore update
        await updateRiderLocation(riderId, lat, lng)
      },
      (err) => {
        console.error("GPS error:", err)
        setError(err.message)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 5000,
      }
    )

    return () => {
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current)
      }
    }
  }, [riderId, enabled])

  return { location, error }
}
