// src/constants/orderStatus.js
export const ORDER_STATUS = {
  PENDING:    "pending",
  ACCEPTED:   "accepted",
  PICKED_UP:  "picked_up",
  DELIVERED:  "delivered",
  CANCELLED:  "cancelled",
}

export const STATUS_LABEL = {
  pending:    "စောင့်ဆိုင်းနေသည်",
  accepted:   "လက်ခံပြီး",
  picked_up:  "ပစ္စည်းယူပြီး",
  delivered:  "ပို့ဆောင်ပြီး",
  cancelled:  "ပယ်ဖျက်ပြီး",
}

export const STATUS_COLOR = {
  pending:    "bg-yellow-100 text-yellow-700",
  accepted:   "bg-blue-100 text-blue-700",
  picked_up:  "bg-purple-100 text-purple-700",
  delivered:  "bg-green-100 text-green-700",
  cancelled:  "bg-red-100 text-red-700",
}
