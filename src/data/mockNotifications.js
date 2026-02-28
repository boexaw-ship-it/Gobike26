// src/data/mockNotifications.js
export const mockNotifications = [
  {
    id: "n1",
    userId: "user1",
    title: "Rider လက်ခံပြီ",
    message: "ကိုမင်းသန့် သင့်အော်ဒါကို လက်ခံပြီဆိုပြီ",
    type: "order_update",
    orderId: "ORD001",
    isRead: false,
    createdAt: new Date(Date.now() - 5 * 60 * 1000),
  },
  {
    id: "n2",
    userId: "user1",
    title: "ပစ္စည်းယူပြီ",
    message: "Rider က ပစ္စည်းယူပြီး သင့်ဆီ ထွက်လာပြီ",
    type: "order_update",
    orderId: "ORD001",
    isRead: false,
    createdAt: new Date(Date.now() - 2 * 60 * 1000),
  },
  {
    id: "n3",
    userId: "user2",
    title: "အော်ဒါသစ်",
    message: "ကမာရွတ်မှ ဒဂုံသို့ ပို့ရမည့် အော်ဒါ ၅၀၀၀ ကျပ်",
    type: "new_order",
    orderId: "ORD002",
    isRead: true,
    createdAt: new Date(Date.now() - 30 * 60 * 1000),
  },
]
