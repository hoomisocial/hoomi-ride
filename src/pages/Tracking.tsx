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
    packageDetails?: {
      weight: string;
      dimensions: string;
      description: string;
    };
    orderType?: "transport" | "delivery";
  } | null;

  // Define stops first before using it
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

  // Get coordinates from stops array as fallback
  const pickupCoords = orderData?.pickupCoords || stops.find(s => s.type === "pickup")?.coords || null;
  const dropoffCoords = orderData?.dropoffCoords || stops.find(s => s.type === "dropoff")?.coords || null;

  // Tracking states
  const [currentStatus, setCurrentStatus] = useState<"on_way_to_pickup" | "arrived_at_pickup" | "picking_up" | "on_way_to_dropoff" | "arrived_at_dropoff" | "completed">("on_way_to_pickup");
  const [driverPosition, setDriverPosition] = useState<[number, number] | null>(null);
  const [progress, setProgress] = useState(0); // 0-100%
  const [isInitialized, setIsInitialized] = useState(false);
  const [routeCoordinates, setRouteCoordinates] = useState<[number, number][]>([]);
  const [currentRouteIndex, setCurrentRouteIndex] = useState(0);

  const MAPBOX_ACCESS_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN || "pk.eyJ1IjoiaG9vbWktcmlkZSIsImEiOiJjbTRyZXhhbWowMDFqMmlzZ3d2OXF4cnN4In0.PLACEHOLDER";

  // Debug: Log coordinates to verify pickup and dropoff are correct
  useEffect(() => {
    console.log("=== TRACKING INITIALIZATION ===");
    console.log("Order Data:", orderData);
    console.log("Pickup Coords:", pickupCoords);
    console.log("Dropoff Coords:", dropoffCoords);
    console.log("All Stops:", stops);
  }, []);

  // Fetch route coordinates from Mapbox API
  useEffect(() => {
    const fetchRoute = async () => {
      if (!pickupCoords || !dropoffCoords) return;

      try {
        // Build route: Pickup -> Dropoff
        const coordinates = `${pickupCoords[0]},${pickupCoords[1]};${dropoffCoords[0]},${dropoffCoords[1]}`;
        
        const response = await fetch(
          `https://api.mapbox.com/directions/v5/mapbox/driving/${coordinates}?` +
          `geometries=geojson&` +
          `access_token=${MAPBOX_ACCESS_TOKEN}`
        );
        const data = await response.json();

        if (data.routes && data.routes.length > 0) {
          const route = data.routes[0].geometry.coordinates;
          console.log("🗺️ Route fetched:", route.length, "points");
          setRouteCoordinates(route as [number, number][]);
        }
      } catch (error) {
        console.error("Error fetching route:", error);
      }
    };

    fetchRoute();
  }, [pickupCoords, dropoffCoords]);

  // Initialize driver position ONCE (start slightly offset from pickup)
  useEffect(() => {
    if (!isInitialized && pickupCoords && routeCoordinates.length > 0) {
      // Reset everything to initial state
      setProgress(0);
      setCurrentStatus("on_way_to_pickup");
      
      // Start driver at the beginning of the route (close to pickup)
      const initialPosition = routeCoordinates[0];
      
      console.log("🚗 INITIALIZING DRIVER");
      console.log("  Initial Position:", initialPosition);
      console.log("  Route has", routeCoordinates.length, "points");
      console.log("  Target PICKUP:", pickupCoords);
      console.log("  Final DROPOFF:", dropoffCoords);
      
      setDriverPosition(initialPosition);
      setCurrentRouteIndex(0);
      setIsInitialized(true);
    }
  }, [pickupCoords, dropoffCoords, isInitialized, routeCoordinates]);

  // Simulate driver movement along the route
  useEffect(() => {
    if (!driverPosition || !pickupCoords || !dropoffCoords || !isInitialized || routeCoordinates.length === 0) {
      console.log("⏸️ Movement paused - waiting for initialization");
      return;
    }

    console.log("▶️ Starting driver movement simulation");

    const interval = setInterval(() => {
      setProgress(prev => {
        const newProgress = Math.min(prev + 0.5, 100); // Very slow: 0.5% per second (200 seconds total)
        
        // Update status based on progress
        if (newProgress >= 100) {
          setCurrentStatus("completed");
        } else if (newProgress >= 90) {
          setCurrentStatus("arrived_at_dropoff");
        } else if (newProgress >= 60) {
          setCurrentStatus("on_way_to_dropoff");
        } else if (newProgress >= 45) {
          setCurrentStatus("picking_up"); // Stay at pickup for loading
        } else if (newProgress >= 40) {
          setCurrentStatus("arrived_at_pickup"); // Arrived at pickup
        } else {
          setCurrentStatus("on_way_to_pickup");
        }
        
        return newProgress;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [driverPosition, pickupCoords, dropoffCoords, isInitialized, routeCoordinates]);

  // Move driver along the route based on progress
  useEffect(() => {
    if (!isInitialized || routeCoordinates.length === 0) return;

    // Calculate which point on the route the driver should be at
    let targetIndex: number;
    let phase: string;

    if (progress < 40) {
      // Phase 1: Moving to pickup (0-40%) - use first 30% of route points
      const pickupPortionLength = Math.floor(routeCoordinates.length * 0.3);
      const progressInPhase = progress / 40; // 0 to 1
      targetIndex = Math.floor(progressInPhase * pickupPortionLength);
      phase = "MOVING TO PICKUP";
    } else if (progress < 45) {
      // Phase 2: Arrived at pickup (40-45%) - stay at pickup location
      const pickupPortionLength = Math.floor(routeCoordinates.length * 0.3);
      targetIndex = pickupPortionLength; // Stay at this point
      phase = "ARRIVED AT PICKUP";
    } else if (progress < 60) {
      // Phase 3: Loading at pickup (45-60%) - stay at pickup location
      const pickupPortionLength = Math.floor(routeCoordinates.length * 0.3);
      targetIndex = pickupPortionLength; // Stay at this point
      phase = "LOADING AT PICKUP";
    } else if (progress < 90) {
      // Phase 4: Moving to dropoff (60-90%) - use remaining 70% of route points
      const pickupPortionLength = Math.floor(routeCoordinates.length * 0.3);
      const remainingPoints = routeCoordinates.length - pickupPortionLength;
      const progressInPhase = (progress - 60) / 30; // 0 to 1
      targetIndex = pickupPortionLength + Math.floor(progressInPhase * remainingPoints);
      phase = "MOVING TO DROPOFF";
    } else {
      // Phase 5: At dropoff (90-100%)
      targetIndex = routeCoordinates.length - 1;
      phase = "ARRIVED AT DROPOFF";
    }

    // Ensure index is within bounds
    targetIndex = Math.max(0, Math.min(targetIndex, routeCoordinates.length - 1));

    // Log every 5%
    if (Math.floor(progress) % 5 === 0 && Math.floor(progress) !== Math.floor(progress - 0.5)) {
      console.log(`📍 Progress ${progress.toFixed(1)}%: ${phase}, Route Point ${targetIndex}/${routeCoordinates.length}`);
    }

    // Smoothly move driver towards target point
    setDriverPosition(prev => {
      if (!prev) return routeCoordinates[targetIndex];

      const target = routeCoordinates[targetIndex];
      const dx = target[0] - prev[0];
      const dy = target[1] - prev[1];
      const distance = Math.sqrt(dx * dx + dy * dy);

      // If very close to target, snap to it
      if (distance < 0.00005) {
        setCurrentRouteIndex(targetIndex);
        return target;
      }

      // Move smoothly towards target
      const step = Math.min(0.0001, distance); // Don't overshoot
      const newPos: [number, number] = [
        prev[0] + (dx / distance) * step,
        prev[1] + (dy / distance) * step
      ];

      return newPos;
    });

    if (progress >= 100) {
      console.log("✅ Journey completed!");
    }
  }, [progress, isInitialized, routeCoordinates]);

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
        center={driverPosition || pickupCoords || [106.8456, -6.2088]}
        pickupCoordinates={pickupCoords}
        dropoffCoordinates={dropoffCoords}
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
