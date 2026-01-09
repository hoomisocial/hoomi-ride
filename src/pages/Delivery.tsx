import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { Header } from "@/components/layout/Header";
import { LocationCard } from "@/components/booking/LocationCard";
import { MapPlaceholder } from "@/components/tracking/MapPlaceholder";

interface Stop {
  id: string;
  type: "pickup" | "dropoff";
  address: string;
  detail: string;
  contact?: string;
  coords?: [number, number];
}

const Delivery = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Receive data from LocationSelection
  const locationState = location.state as {
    pickup?: string;
    dropoff?: string;
    pickupCoords?: [number, number];
    dropoffCoords?: [number, number];
    updatedStops?: Stop[];
  } | null;

  const [stops, setStops] = useState<Stop[]>([
    { id: "1", type: "pickup" as const, address: "", detail: "", contact: "" },
    { id: "2", type: "dropoff" as const, address: "", detail: "", contact: "" },
  ]);

  // Update stops when receiving data from LocationSelection
  useEffect(() => {
    if (locationState?.updatedStops) {
      // Received full stops array (from add stop flow)
      setStops(locationState.updatedStops);
    } else if (locationState?.pickup && locationState?.dropoff) {
      // Received pickup and dropoff from fresh location selection
      setStops(prev => {
        const newStops = [...prev];
        // Update pickup
        const pickupIndex = newStops.findIndex(s => s.type === "pickup");
        if (pickupIndex >= 0) {
          newStops[pickupIndex] = {
            ...newStops[pickupIndex],
            address: locationState.pickup!,
            detail: locationState.pickupCoords 
              ? `${locationState.pickupCoords[1].toFixed(6)}, ${locationState.pickupCoords[0].toFixed(6)}`
              : "",
            coords: locationState.pickupCoords,
          };
        }
        // Update dropoff
        const dropoffIndex = newStops.findIndex(s => s.type === "dropoff");
        if (dropoffIndex >= 0) {
          newStops[dropoffIndex] = {
            ...newStops[dropoffIndex],
            address: locationState.dropoff!,
            detail: locationState.dropoffCoords
              ? `${locationState.dropoffCoords[1].toFixed(6)}, ${locationState.dropoffCoords[0].toFixed(6)}`
              : "",
            coords: locationState.dropoffCoords,
          };
        }
        return newStops;
      });
    }
  }, [locationState]);

  // Get coordinates for map display
  const pickupCoords = stops.find(s => s.type === "pickup")?.coords || null;
  const dropoffCoords = stops.find(s => s.type === "dropoff")?.coords || null;
  const intermediateStops = stops.slice(1, -1).filter(s => s.coords).map(s => s.coords!);

  const handleAddStop = () => {
    // Navigate to LocationSelection to add new stop
    if (pickupCoords && dropoffCoords) {
      navigate("/location-selection?type=delivery", {
        state: {
          addingNewStop: true,
          currentPickup: stops.find(s => s.type === "pickup")?.address,
          currentDropoff: stops.find(s => s.type === "dropoff")?.address,
          pickupCoords,
          dropoffCoords,
          allStops: stops,
        },
      });
    } else {
      // Need to set pickup and dropoff first
      alert("Silakan pilih lokasi penjemputan dan tujuan terlebih dahulu");
    }
  };

  const handleRemoveStop = (id: string) => {
    // Don't allow removing first pickup or last dropoff
    const stop = stops.find(s => s.id === id);
    if (stop?.type === "pickup" && stops.filter(s => s.type === "pickup").length <= 1) return;
    if (stop?.type === "dropoff" && stops.filter(s => s.type === "dropoff").length <= 1) return;
    
    setStops(stops.filter((s) => s.id !== id));
  };

  const handleEditStop = (id: string) => {
    const stop = stops.find(s => s.id === id);
    if (!stop) return;

    navigate("/location-selection?type=delivery", {
      state: {
        editingStopId: id,
        editingStopType: stop.type,
        currentPickup: stops.find(s => s.type === "pickup")?.address,
        currentDropoff: stops.find(s => s.type === "dropoff")?.address,
        pickupCoords,
        dropoffCoords,
        allStops: stops,
      },
    });
  };

  const handleContinue = () => {
    // Validate that we have addresses
    const pickup = stops.find(s => s.type === "pickup");
    const dropoff = stops.find(s => s.type === "dropoff");

    if (!pickup?.address || !dropoff?.address) {
      alert("Silakan pilih lokasi penjemputan dan tujuan terlebih dahulu");
      return;
    }

    // Navigate to DeliveryDetails with all stop data
    navigate("/delivery/details", {
      state: {
        stops,
        pickupCoords,
        dropoffCoords,
      },
    });
  };

  // Check if we have valid locations
  const hasValidLocations = stops.some(s => s.type === "pickup" && s.address) && 
                           stops.some(s => s.type === "dropoff" && s.address);

  // If no locations set yet, redirect to location selection
  const handleSelectLocation = () => {
    navigate("/location-selection?type=delivery");
  };

  return (
    <MobileLayout className="relative flex flex-col h-screen">
      {/* Fullscreen Map Background */}
      <MapPlaceholder 
        className="absolute inset-0 w-full h-full z-0"
        center={pickupCoords || [106.8456, -6.2088]}
        pickupCoordinates={pickupCoords}
        dropoffCoordinates={dropoffCoords}
        intermediateStops={intermediateStops}
        showPickupMarker={!!pickupCoords}
        showDropoffMarker={!!dropoffCoords}
        autoFitBounds={!!pickupCoords && !!dropoffCoords}
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
          onEditStop={handleEditStop}
        />
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Continue Button */}
      <div className="relative z-40 px-4 pb-8 pt-4 flex-shrink-0 bg-gradient-to-t from-background to-transparent">
        {!hasValidLocations ? (
          <button
            onClick={handleSelectLocation}
            className="btn-shadow w-full rounded-full bg-primary py-4 text-center font-semibold text-primary-foreground"
          >
            Pilih Lokasi
          </button>
        ) : (
          <button
            onClick={handleContinue}
            className="btn-shadow w-full rounded-full bg-primary py-4 text-center font-semibold text-primary-foreground"
          >
            Tambah Detail Pengiriman
          </button>
        )}
      </div>
    </MobileLayout>
  );
};

export default Delivery;
