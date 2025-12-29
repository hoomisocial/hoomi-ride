import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { Header } from "@/components/layout/Header";
import { LocationCard } from "@/components/booking/LocationCard";
import { MapPlaceholder } from "@/components/tracking/MapPlaceholder";

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
    <MobileLayout className="relative flex flex-col h-screen">
      {/* Fullscreen Map Background */}
      <MapPlaceholder className="absolute inset-0 w-full h-full z-0" />
      
      {/* Content Layer */}
      <Header title="Delivery" className="relative z-10 h-32 rounded-b-3xl flex-shrink-0" />
      
      <div className="relative py-4 z-50 -mt-20 flex-shrink-0">
        <LocationCard
          className="mx-4"
          pickupTime="Today 14:20"
          deliveryTime="Tomorrow 00:00 - 01:00"
          stops={stops}
          onAddStop={handleAddStop}
          onRemoveStop={handleRemoveStop}
          onEditStop={(id) => navigate(`/location/${id}`)}
        />
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Continue Button */}
      <div className="relative z-40 px-4 pb-8 pt-4 flex-shrink-0 bg-gradient-to-t from-background to-transparent">
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
