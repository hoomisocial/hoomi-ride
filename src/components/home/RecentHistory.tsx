import { useNavigate } from "react-router-dom";
import MotorcycleIcon from "@/assets/Motorcycle.svg";
import BoxIcon from "@/assets/Box.svg";

const recentOrders = [
  { id: 1, type: "transport", date: "2 Nov, 20:03" },
  { id: 2, type: "delivery", date: "2 Nov, 18:45" },
];

export function RecentHistory() {
  const navigate = useNavigate();

  return (
    <section className="mt-6 px-4 pb-24">
      <h2 className="mb-3 text-lg font-semibold text-foreground">History</h2>

      <div className="grid grid-cols-2 gap-3">
        {recentOrders.map((order) => (
          <button
            key={order.id}
            onClick={() => navigate("/history")}
            className="card-shadow flex flex-col items-center gap-2 rounded-2xl bg-card p-4 transition-transform active:scale-[0.98]"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              {order.type === "transport" ? (
                <img src={MotorcycleIcon} alt="Transport" className="h-6 w-6" />
              ) : (
                <img src={BoxIcon} alt="Delivery" className="h-6 w-6" />
              )}
            </div>
            <p className="text-xs text-muted-foreground">{order.date}</p>
          </button>
        ))}
      </div>
    </section>
  );
}
