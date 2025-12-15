import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { Header } from "@/components/layout/Header";
import { OrderCard } from "@/components/history/OrderCard";

type Tab = "transport" | "delivery";
type Status = "ongoing" | "completed" | "cancelled";

const orders = [
  { id: 1, type: "transport" as const, date: "2 Nov, 20:03", destination: "Stasiun Pasar Minggu", status: "completed" as const, price: 14000 },
  { id: 2, type: "transport" as const, date: "2 Nov, 20:03", destination: "Stasiun Pasar Minggu", status: "completed" as const, price: 14000 },
  { id: 3, type: "transport" as const, date: "2 Nov, 20:03", destination: "Stasiun Pasar Minggu", status: "completed" as const, price: 14000 },
  { id: 4, type: "transport" as const, date: "2 Nov, 20:03", destination: "Stasiun Pasar Minggu", status: "completed" as const, price: 14000 },
  { id: 5, type: "delivery" as const, date: "2 Nov, 20:03", destination: "Stasiun Pasar Minggu", status: "completed" as const, price: 14000 },
  { id: 6, type: "delivery" as const, date: "2 Nov, 20:03", destination: "Stasiun Pasar Minggu", status: "completed" as const, price: 14000 },
];

const History = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>("transport");
  const [activeStatus, setActiveStatus] = useState<Status>("ongoing");

  const filteredOrders = orders.filter((order) => order.type === activeTab);

  const handleReorder = (orderId: number) => {
    const order = orders.find((o) => o.id === orderId);
    if (order) {
      navigate(order.type === "transport" ? "/transport" : "/delivery");
    }
  };

  return (
    <MobileLayout className="bg-background">
      <Header title="Orders" />
      
      {/* Tabs */}
      <div className="flex border-b border-border px-4">
        <button
          onClick={() => setActiveTab("transport")}
          className={`flex-1 border-b-2 py-3 text-center font-medium transition-colors ${
            activeTab === "transport"
              ? "border-primary text-foreground"
              : "border-transparent text-muted-foreground"
          }`}
        >
          Transport
        </button>
        <button
          onClick={() => setActiveTab("delivery")}
          className={`flex-1 border-b-2 py-3 text-center font-medium transition-colors ${
            activeTab === "delivery"
              ? "border-primary text-foreground"
              : "border-transparent text-muted-foreground"
          }`}
        >
          Delivery
        </button>
      </div>

      {/* Status Filters */}
      <div className="flex gap-2 px-4 py-3">
        {(["ongoing", "completed", "cancelled"] as Status[]).map((status) => (
          <button
            key={status}
            onClick={() => setActiveStatus(status)}
            className={`rounded-full px-4 py-2 text-sm font-medium capitalize transition-colors ${
              activeStatus === status
                ? "bg-foreground text-background"
                : "border border-border bg-card text-foreground"
            }`}
          >
            {status === "ongoing" ? "On Going" : status}
          </button>
        ))}
      </div>

      {/* Orders List */}
      <div className="space-y-3 px-4 pb-24">
        {filteredOrders.map((order) => (
          <div key={order.id}>
            <p className="mb-2 text-sm text-muted-foreground">{order.date}</p>
            <OrderCard
              type={order.type}
              date={order.date}
              destination={order.destination}
              status={order.status}
              price={order.price}
              onReorder={() => handleReorder(order.id)}
            />
          </div>
        ))}
      </div>
    </MobileLayout>
  );
};

export default History;
