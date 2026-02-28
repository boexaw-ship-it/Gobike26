// src/components/ui/OrderCard.jsx
import { STATUS_LABEL, STATUS_COLOR } from "../../constants/orderStatus"

export default function OrderCard({ order, onClick }) {
  const timeAgo = (date) => {
    const mins = Math.floor((Date.now() - date) / 60000)
    if (mins < 60) return `${mins} မိနစ်ကြာပြီ`
    return `${Math.floor(mins / 60)} နာရီကြာပြီ`
  }

  return (
    <div
      onClick={onClick}
      className="card mb-3 cursor-pointer active:scale-[0.98] transition-transform animate-slide-up"
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-xs text-gray-400 font-body">#{order.id}</p>
          <p className="font-display font-bold text-base text-gray-800">
            {order.price.toLocaleString()} ကျပ်
          </p>
        </div>
        <span className={`status-badge ${STATUS_COLOR[order.status]}`}>
          {STATUS_LABEL[order.status]}
        </span>
      </div>

      <div className="space-y-2 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
          <p className="text-xs text-gray-600 font-body truncate">{order.pickup.address}</p>
        </div>
        <div className="ml-1 w-px h-3 bg-gray-200 ml-[3px]" />
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0" />
          <p className="text-xs text-gray-600 font-body truncate">{order.dropoff.address}</p>
        </div>
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
        <p className="text-xs text-gray-400">{timeAgo(order.createdAt)}</p>
        <p className="text-xs text-gray-500">{order.distance} km</p>
      </div>
    </div>
  )
}
