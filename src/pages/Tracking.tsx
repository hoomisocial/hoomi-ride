import { useLocation, useNavigate } from "react-router-dom";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { Header } from "@/components/layout/Header";
import { LocationCard } from "@/components/booking/LocationCard";
import { MapPlaceholder } from "@/components/tracking/MapPlaceholder";
import { StatusBanner } from "@/components/tracking/StatusBanner";
import { DriverInfo } from "@/components/tracking/DriverInfo";

const Tracking = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const orderData = location.state as {
    pickup: string;
    dropoff: string;
    stops: Array<{ id: string; type: "pickup" | "dropoff"; address: string; detail: string; contact: string }>;
    estimatedTime: string;
    distance: string;
    price: number;
  } | null;

  const stops = orderData?.stops || [
    {
      id: "1",
      type: "pickup" as const,
      address: "Jl. Amil No. 45",
      detail: "Detail location",
      contact: "Nama - Telp",
    },
    {
      id: "2",
      type: "dropoff" as const,
      address: "Jl. Kemang Raya No. 12",
      detail: "Detail location",
      contact: "Nama - Telp",
    },
  ];
  return (
    <MobileLayout className="relative flex flex-col h-screen">
      {/* Fullscreen Map Background */}
      <MapPlaceholder className="absolute inset-0 w-full h-full z-0" />
      
      {/* Content Layer */}
      <Header title="Detail Pesanan" className="relative z-10 h-32 rounded-b-3xl flex-shrink-0" />
      
      <div className="relative py-4 z-50 -mt-20 flex-shrink-0">
        <LocationCard
          className="mx-4"
          pickupTime="Today 14:20"
          deliveryTime="Tomorrow 00:00 - 01:00"
          stops={stops}
          onAddStop={() => {}}
        />
      </div>

      {/* Spacer */}
      <div className="flex-1" />
      
      <div className="absolute bottom-0 left-0 right-0 z-50 ">
        <div className="-mt-4 mb-3">
          <StatusBanner message="Driver kamu hampir sampai." eta="2 min" />
        </div>

        <DriverInfo
          licensePlate="B 3295 SZK"
          vehicleModel="Honda Beat"
          driverName="Budianto"
          rating={4.8}
        />
      </div>
    </MobileLayout>
  );
};

export default Tracking;
