import { useNavigate } from "react-router-dom";
import MotorcycleIcon from "@/assets/Motorcycle.svg";
import BoxIcon from "@/assets/Box.svg";

export function ServiceButtons() {
  const navigate = useNavigate();

  return (
    <section className="relative z-10 -mt-4 px-4">
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => navigate("/location-selection?type=transport")}
          className="flex flex-col items-center gap-2 rounded-2xl bg-card p-6 shadow-lg transition-transform active:scale-[0.98]"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <img src={MotorcycleIcon} alt="Transport" className="h-6 w-6" />
          </div>
          <span className="font-bold text-primary">Transport</span>
        </button>

        <button
          onClick={() => navigate("/location-selection?type=delivery")}
          className="flex flex-col items-center gap-2 rounded-2xl bg-card p-6 shadow-lg transition-transform active:scale-[0.98]"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <img src={BoxIcon} alt="Delivery" className="h-6 w-6" />
          </div>
          <span className="font-bold text-primary">Delivery</span>
        </button>
      </div>
    </section>
  );
}
