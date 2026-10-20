import { ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import MotorcycleOrderIcon from "@/assets/Motorcycle-Order.svg";

interface ActiveOrderProps {
  hasActiveOrder?: boolean;
}

export function ActiveOrder({ hasActiveOrder = true }: ActiveOrderProps) {
  const navigate = useNavigate();

  if (!hasActiveOrder) return null;

  return (
    <section className="mt-4 px-4">
      <button
        onClick={() => navigate("/tracking/123")}
        className="card-shadow flex w-full items-center gap-6 rounded-2xl bg-card p-4 transition-transform active:scale-[0.99]"
      >
        <div className="relative">
          <img src={MotorcycleOrderIcon} alt="Motorcycle" className="h-12 w-12" />
        </div>

        <div className="flex-1 text-left">
          <p className="font-bold text-primary mb-2">
            Pengemudi sampai dalam 2 menit
          </p>
          <div className="inline-block bg-primary/10 px-3 py-1 rounded-full">
            <p className="text-xs text-primary font-medium">
              Jl. Amil No. 45, Pejaten Barat, Pasar Minggu
            </p>
          </div>
        </div>

        {/* <ChevronRight className="h-5 w-5 text-muted-foreground" /> */}
      </button>
    </section>
  );
}
