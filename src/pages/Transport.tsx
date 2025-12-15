import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { Header } from "@/components/layout/Header";
import { LocationCard } from "@/components/booking/LocationCard";
import { PaymentSheet } from "@/components/booking/PaymentSheet";

const Transport = () => {
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

  const handleOrder = () => {
    navigate("/tracking/123");
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

      <PaymentSheet
        options={[
          { estimatedTime: "10 - 15 menit", distance: "8.0 km", price: 15000 },
        ]}
        walletBalance={12000}
        onOrder={handleOrder}
      />
    </MobileLayout>
  );
};

export default Transport;
