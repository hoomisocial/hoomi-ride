import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { Header } from "@/components/layout/Header";
import { LocationCard } from "@/components/booking/LocationCard";

const Delivery = () => {
  const navigate = useNavigate();
  const [stops, setStops] = useState([
    { id: "1", type: "pickup" as const, address: "", detail: "", contact: "" },
    { id: "2", type: "dropoff" as const, address: "", detail: "", contact: "" },
  ]);

  const handleAddStop = () => {
    const newStop = {
      id: Date.now().toString(),
      type: "dropoff" as const,
      address: "",
      detail: "",
      contact: "",
    };
    setStops([...stops, newStop]);
  };

  const handleRemoveStop = (id: string) => {
    setStops(stops.filter((s) => s.id !== id));
  };

  const handleContinue = () => {
    navigate("/delivery/details");
  };

  return (
    <MobileLayout className="bg-background">
      <Header title="Delivery" />
      
      <div className="py-4">
        <LocationCard
          pickupTime="Today 14:20"
          deliveryTime="Tomorrow 00:00 - 01:00"
          stops={stops}
          onAddStop={handleAddStop}
          onRemoveStop={handleRemoveStop}
          onEditStop={(id) => navigate(`/location/${id}`)}
        />
      </div>

      {/* Continue Button */}
      <div className="fixed bottom-0 left-1/2 z-40 w-full max-w-md -translate-x-1/2 px-4 pb-8 pt-4">
        <button
          onClick={handleContinue}
          className="btn-shadow w-full rounded-full bg-primary py-4 text-center font-semibold text-primary-foreground"
        >
          Tambah Detail Pengiriman
        </button>
      </div>
    </MobileLayout>
  );
};

export default Delivery;
