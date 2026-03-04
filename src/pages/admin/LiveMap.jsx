// src/pages/admin/LiveMap.jsx
import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { collection, query, where, onSnapshot } from "firebase/firestore"
import { db } from "../../firebase/config"
import MapView from "../../components/map/MapView"

export default function LiveMap() {
  const navigate = useNavigate()
  const [onlineRiders, setOnlineRiders] = useState([])
  const [activeOrders, setActiveOrders] = useState([])
  const [selected, setSelected]         = useState(null)

  // Online riders
  useEffect(() => {
    const q = query(collection(db,"riders"), where("isOnline","==",true))
    return onSnapshot(q, snap => {
      setOnlineRiders(snap.docs.map(d => ({ id:d.id, ...d.data() })))
    })
  }, [])

  // Active orders
  useEffect(() => {
    const q = query(collection(db,"orders"), where("status","in",["accepted","picked_up"]))
    return onSnapshot(q, snap => {
      setActiveOrders(snap.docs.map(d => ({ id:d.id, ...d.data() })))
    })
  }, [])

  // Map riders with position (use pickup/dropoff coords as proxy if no GPS)
  const mapRiders = onlineRiders.map(r => {
    const activeOrder = activeOrders.find(o => o.riderId === r.id)
    return {
      ...r,
      lat: r.lat || activeOrder?.pickup?.lat || 16.8409,
      lng: r.lng || activeOrder?.pickup?.lng || 96.1353,
      activeOrder,
    }
  })

  return (
    <div className="flex flex-col h-screen bg-dark">
      {/* Header */}
      <div className="px-4 pt-10 pb-3 bg-dark z-40 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/admin")} className="text-gray-400 text-sm">← ပြန်</button>
          <div>
            <p className="text-white font-display font-black">🗺️ Live Map</p>
            <p className="text-gray-500 text-xs">Real-time Riders</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-full">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs text-white font-semibold">{onlineRiders.length} Online</span>
          </div>
          <div className="bg-white/10 px-3 py-1.5 rounded-full">
            <span className="text-xs text-white font-semibold">📦 {activeOrders.length} Active</span>
          </div>
        </div>
      </div>

      {/* Map */}
      <div className="flex-1 relative">
        <MapView riders={mapRiders} height="100%" />

        {/* Rider list overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-dark/95 backdrop-blur-sm rounded-t-3xl px-4 pt-4 pb-6 max-h-64 overflow-y-auto">
          <div className="w-10 h-1 bg-gray-600 rounded-full mx-auto mb-3" />
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
            Riders ({onlineRiders.length})
          </p>
          {onlineRiders.length === 0 ? (
            <p className="text-gray-500 text-xs text-center py-4">Online rider မရှိပါ</p>
          ) : (
            <div className="space-y-2">
              {onlineRiders.map(r => {
                const order = activeOrders.find(o => o.riderId === r.id)
                return (
                  <div key={r.id}
                    onClick={() => setSelected(selected?.id === r.id ? null : r)}
                    className={`flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition-all
                      ${selected?.id === r.id ? "bg-primary-500/20 border border-primary-500/40" : "bg-white/5"}`}>
                    <div className="w-9 h-9 bg-primary-100 rounded-xl flex items-center justify-center font-black text-primary-600 text-sm shrink-0">
                      {r.name?.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <p className="text-white text-sm font-bold">{r.name}</p>
                      <p className="text-gray-400 text-xs">{r.phone}</p>
                    </div>
                    <div className="text-right">
                      {order ? (
                        <>
                          <p className="text-xs text-blue-400 font-bold">🏍️ Delivering</p>
                          <p className="text-[10px] text-gray-500 truncate max-w-[100px]">
                            → {order.dropoff?.township}
                          </p>
                        </>
                      ) : (
                        <p className="text-xs text-green-400 font-bold">✅ Available</p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
