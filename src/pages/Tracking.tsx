import { useState, useEffect } from "react";
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
    stops: Array<{ id: string; type: "pickup" | "dropoff"; address: string; detail: string; coords?: [number, number] }>;
    pickupCoords?: [number, number];
    dropoffCoords?: [number, number];
    estimatedTime: string;
    distance: string;
    price: number;
  } | null;

  // Tracking states
  const [currentStatus, setCurrentStatus] = useState<"on_way_to_pickup" | "arrived_at_pickup" | "picking_up" | "on_way_to_dropoff" | "arrived_at_dropoff" | "completed">("on_way_to_pickup");
  const [driverPosition, setDriverPosition] = useState<[number, number] | null>(null);
  const [progress, setProgress] = useState(0); // 0-100%

  const stops = orderData?.stops || [
    {
      id: "1",
      type: "pickup" as const,
      address: "Jl. Amil No. 45",
      detail: "Detail location",
    },
    {
      id: "2",
      type: "dropoff" as const,
      address: "Jl. Kemang Raya No. 12",
      detail: "Detail location",
    },
  ];

  // Initialize driver position (start slightly offset from pickup)
  useEffect(() => {
    if (orderData?.pickupCoords) {
      // Start driver 500m away from pickup
      const offset = 0.005; // ~500m
      setDriverPosition([
        orderData.pickupCoords[0] - offset,
        orderData.pickupCoords[1] - offset
      ]);
    }
  }, [orderData?.pickupCoords]);

  // Simulate driver movement
  useEffect(() => {
    if (!driverPosition || !orderData?.pickupCoords || !orderData?.dropoffCoords) return;

    const interval = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev + 2; // Increment by 2%
        
        // Update status based on progress
        if (newProgress >= 100) {
          setCurrentStatus("completed");
          clearInterval(interval);
          return 100;
        } else if (newProgress >= 90) {
          setCurrentStatus("arrived_at_dropoff");
        } else if (newProgress >= 60) {
          setCurrentStatus("on_way_to_dropoff");
        } else if (newProgress >= 40) {
          setCurrentStatus("picking_up");
        } else if (newProgress >= 20) {
          setCurrentStatus("arrived_at_pickup");
        } else {
          setCurrentStatus("on_way_to_pickup");
        }
        
        return newProgress;
      });

      // Move driver position
      setDriverPosition(prev => {
        if (!prev || !orderData.pickupCoords || !orderData.dropoffCoords) return prev;
        
        let targetCoords: [number, number];
        
        // Determine target based on progress - ALWAYS GO TO PICKUP FIRST
        if (progress < 20) {
          // Phase 1: Moving to pickup location
          targetCoords = orderData.pickupCoords;
        } else if (progress < 40) {
          // Phase 2: At pickup location (waiting/picking up)
          targetCoords = orderData.pickupCoords;
        } else if (progress < 90) {
          // Phase 3: Moving to dropoff (via intermediate stops if any)
          const intermediateStops = stops.slice(1, -1).filter(s => s.coords);
          
          if (intermediateStops.length > 0 && progress < 70) {
            // Moving through intermediate stops
            const stopProgress = (progress - 40) / 30; // 0 to 1
            const stopIndex = Math.floor(stopProgress * intermediateStops.length);
            targetCoords = intermediateStops[Math.min(stopIndex, intermediateStops.length - 1)].coords!;
          } else {
            // Moving to final dropoff
            targetCoords = orderData.dropoffCoords;
          }
        } else {
          // Phase 4: At dropoff location
          targetCoords = orderData.dropoffCoords;
        }
        
        // Calculate new position (linear interpolation)
        const step = 0.0002; // Speed of movement
        const dx = targetCoords[0] - prev[0];
        const dy = targetCoords[1] - prev[1];
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < 0.0001) return targetCoords; // Arrived
        
        return [
          prev[0] + (dx / distance) * step,
          prev[1] + (dy / distance) * step
        ];
      });
    }, 1000); // Update every second

    return () => clearInterval(interval);
  }, [driverPosition, orderData, progress, stops]);

  // Get status message
  const getStatusMessage = () => {
    switch (currentStatus) {
      case "on_way_to_pickup":
        return "Driver menuju lokasi penjemputan";
      case "arrived_at_pickup":
        return "Driver sudah sampai di lokasi penjemputan";
      case "picking_up":
        return "Driver sedang mengambil paket";
      case "on_way_to_dropoff":
        return "Driver dalam perjalanan ke tujuan";
      case "arrived_at_dropoff":
        return "Driver sudah sampai di tujuan";
      case "completed":
        return "Pengiriman selesai";
    }
  };

  // Get ETA
  const getETA = () => {
    if (currentStatus === "completed") return "Selesai";
    const remainingProgress = 100 - progress;
    const eta = Math.ceil(remainingProgress / 2); // Rough estimate in minutes
    return `${eta} min`;
  };
  
  return (
    <MobileLayout className="relative flex flex-col h-screen">
      {/* Fullscreen Map Background */}
      <MapPlaceholder 
        className="absolute inset-0 w-full h-full z-0"
        center={driverPosition || orderData?.pickupCoords || [106.8456, -6.2088]}
        pickupCoordinates={orderData?.pickupCoords || null}
        dropoffCoordinates={orderData?.dropoffCoords || null}
        intermediateStops={stops.slice(1, -1).filter(s => s.coords).map(s => s.coords!)}
        driverCoordinates={driverPosition}
        showPickupMarker={true}
        showDropoffMarker={true}
        showDriverMarker={true}
        autoFitBounds={false}
      />
      
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
          <StatusBanner message={getStatusMessage()} eta={getETA()} />
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
