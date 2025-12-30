import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { Header } from "@/components/layout/Header";
import { LocationCard } from "@/components/booking/LocationCard";
import { PaymentSheet } from "@/components/booking/PaymentSheet";
import { MapPlaceholder } from "@/components/tracking/MapPlaceholder";

const Transport = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const locationData = location.state as { 
    pickup: string; 
    dropoff: string;
    pickupCoords?: [number, number];
    dropoffCoords?: [number, number];
  } | null;
  
  const [stops, setStops] = useState([
    { id: "1", type: "pickup" as const, address: locationData?.pickup || "", detail: "Detail location", contact: "Nama - Telp" },
    { id: "2", type: "dropoff" as const, address: locationData?.dropoff || "", detail: "Detail location", contact: "Nama - Telp" },
  ]);

  useEffect(() => {
    // Redirect to location selection if no location data
    if (!locationData) {
      navigate("/location-selection?type=transport");
    }
  }, [locationData, navigate]);

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
    navigate("/tracking/123", {
      state: {
        pickup: stops[0].address,
        dropoff: stops[stops.length - 1].address,
        stops: stops,
        estimatedTime: "10 - 15 menit",
        distance: "8.0 km",
        price: 15000,
      },
    });
  };

  return (
    <MobileLayout className="relative flex flex-col h-screen">
      {/* Fullscreen Map Background */}
      <MapPlaceholder 
        className="absolute inset-0 w-full h-full z-0"
        center={locationData?.pickupCoords || [106.8456, -6.2088]}
        pickupCoordinates={locationData?.pickupCoords || null}
        dropoffCoordinates={locationData?.dropoffCoords || null}
        showPickupMarker={true}
        showDropoffMarker={true}
      />
      
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

      <div className="relative z-10 flex-shrink-0">
        <PaymentSheet
          options={[
            {
              estimatedTime: "10 - 15 menit",
              distance: "8.0 km",
              price: 15000,
            },
          ]}
          walletBalance={12000}
          onOrder={handleOrder}
        />
      </div>
    </MobileLayout>
  );
};

export default Transport;
