import { MobileLayout } from "@/components/layout/MobileLayout";
import { Header } from "@/components/layout/Header";
import { LocationCard } from "@/components/booking/LocationCard";
import { MapPlaceholder } from "@/components/tracking/MapPlaceholder";
import { StatusBanner } from "@/components/tracking/StatusBanner";
import { DriverInfo } from "@/components/tracking/DriverInfo";

const stops = [
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

const Tracking = () => {
  return (
    <MobileLayout className="bg-background">
      <Header title="Detail Pesanan" />
      
      <div className="py-4">
        <LocationCard
          pickupTime="Today 14:20"
          deliveryTime="Tomorrow 00:00 - 01:00"
          stops={stops}
          onAddStop={() => {}}
        />
      </div>

      <MapPlaceholder />
      
      <div className="-mt-4">
        <StatusBanner message="Driver kamu hampir sampai." eta="2 min" />
      </div>

      <DriverInfo
        licensePlate="B 3295 SZK"
        vehicleModel="Honda Beat"
        driverName="Budianto"
        rating={4.8}
      />
    </MobileLayout>
  );
};

export default Tracking;
