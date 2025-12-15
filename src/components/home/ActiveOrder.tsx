import { Bike, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

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
        className="card-shadow flex w-full items-center gap-3 rounded-2xl bg-card p-4 transition-transform active:scale-[0.99]"
      >
        <div className="relative">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <Bike className="h-5 w-5 text-primary" />
          </div>
          <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
            !
          </span>
        </div>
        
        <div className="flex-1 text-left">
          <p className="font-semibold text-primary">Pengemudi sampai dalam 2 menit</p>
          <p className="text-sm text-muted-foreground">
            Jl. Amil No. 45, Pejaten Barat, Pasar Minggu
          </p>
        </div>
        
        <ChevronRight className="h-5 w-5 text-muted-foreground" />
      </button>
    </section>
  );
}
