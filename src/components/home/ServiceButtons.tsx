import { Bike, Package } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function ServiceButtons() {
  const navigate = useNavigate();

  return (
    <section className="-mt-4 px-4">
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => navigate("/transport")}
          className="card-shadow flex flex-col items-center gap-2 rounded-2xl bg-card p-6 transition-transform active:scale-[0.98]"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Bike className="h-6 w-6 text-primary" />
          </div>
          <span className="font-semibold text-foreground">Transport</span>
        </button>

        <button
          onClick={() => navigate("/delivery")}
          className="card-shadow flex flex-col items-center gap-2 rounded-2xl bg-card p-6 transition-transform active:scale-[0.98]"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Package className="h-6 w-6 text-primary" />
          </div>
          <span className="font-semibold text-foreground">Delivery</span>
        </button>
      </div>
    </section>
  );
}
