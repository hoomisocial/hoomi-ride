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
    updatedStops?: Array<{ id: string; type: "pickup" | "dropoff"; address: string; detail: string; coords?: [number, number] }>;
  } | null;
  
  const [stops, setStops] = useState<Array<{ 
    id: string; 
    type: "pickup" | "dropoff"; 
    address: string; 
    detail: string; 
    coords?: [number, number];
  }>>([
    { 
      id: "1", 
      type: "pickup" as const, 
      address: locationData?.pickup || "", 
      detail: "Detail location",
      coords: locationData?.pickupCoords 
    },
    { 
      id: "2", 
      type: "dropoff" as const, 
      address: locationData?.dropoff || "", 
      detail: "Detail location",
      coords: locationData?.dropoffCoords 
    },
  ]);

  // Update stops when coming back with new stop added
  useEffect(() => {
    if (locationData?.updatedStops) {
      setStops(locationData.updatedStops);
    }
  }, [locationData?.updatedStops]);

  const [routeData, setRouteData] = useState<{
    distance: number; // in meters
    duration: number; // in seconds
    price: number;
  } | null>(null);

  useEffect(() => {
    // Redirect to location selection if no location data
    if (!locationData) {
      navigate("/location-selection?type=transport");
    }
  }, [locationData, navigate]);

  // Fetch route data for dynamic pricing
  useEffect(() => {
    const fetchRouteData = async () => {
      if (!locationData?.pickupCoords || !locationData?.dropoffCoords) return;

      try {
        const token = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
        
        // Build coordinates string with all waypoints including intermediate stops
        const coordinateParts: string[] = [];
        
        // Add pickup
        coordinateParts.push(`${locationData.pickupCoords[0]},${locationData.pickupCoords[1]}`);
        
        // Add intermediate stops (excluding first pickup and last dropoff)
        const intermediateStops = stops.slice(1, -1);
        for (const stop of intermediateStops) {
          if (stop.coords) {
            coordinateParts.push(`${stop.coords[0]},${stop.coords[1]}`);
          }
        }
        
        // Add dropoff
        coordinateParts.push(`${locationData.dropoffCoords[0]},${locationData.dropoffCoords[1]}`);
        
        const coordinates = coordinateParts.join(';');
        
        const response = await fetch(
          `https://api.mapbox.com/directions/v5/mapbox/driving/${coordinates}?` +
          `geometries=geojson&` +
          `access_token=${token}`
        );
        const data = await response.json();

        if (data.routes && data.routes.length > 0) {
          const route = data.routes[0];
          const distanceInMeters = route.distance; // meters
          const durationInSeconds = route.duration; // seconds
          const distanceInKm = distanceInMeters / 1000;

          // Calculate price with progressive per-km rate
          const baseFare = 5000; // Rp 5000
          const minFare = 12000; // Rp 12.000 minimum fare
          const extraStopFee = 1000; // Rp 1000 per extra stop
          
          // Progressive rate per kilometer
          let distanceCost = 0;
          if (distanceInKm <= 3) {
            // 0-3 km: Rp 2000/km
            distanceCost = distanceInKm * 2000;
          } else if (distanceInKm <= 10) {
            // 3-10 km: first 3km at 2000, rest at 2500
            distanceCost = (3 * 2000) + ((distanceInKm - 3) * 2500);
          } else {
            // >10 km: first 3km at 2000, next 7km at 2500, rest at 3000
            distanceCost = (3 * 2000) + (7 * 2500) + ((distanceInKm - 10) * 3000);
          }
          
          const extraStopsCount = Math.max(0, stops.length - 2); // Exclude pickup and final dropoff
          const calculatedPrice = Math.max(
            minFare,
            Math.round(
              baseFare + 
              distanceCost +
              (extraStopsCount * extraStopFee)
            )
          );

          setRouteData({
            distance: distanceInMeters,
            duration: durationInSeconds,
            price: calculatedPrice,
          });
        }
      } catch (error) {
        console.error("Error fetching route data:", error);
      }
    };

    fetchRouteData();
  }, [locationData, stops]);

  const handleAddStop = () => {
    // Navigate to location selection to add new stop
    navigate("/location-selection?type=transport", {
      state: {
        addingNewStop: true,
        currentPickup: stops[0].address,
        currentDropoff: stops[stops.length - 1].address,
        pickupCoords: locationData?.pickupCoords,
        dropoffCoords: locationData?.dropoffCoords,
        allStops: stops,
      }
    });
  };

  const handleRemoveStop = (id: string) => {
    setStops(stops.filter((s) => s.id !== id));
  };

  const handleEditStop = (id: string) => {
    // Navigate to location selection to edit the stop
    const stop = stops.find((s) => s.id === id);
    if (stop) {
      navigate("/location-selection?type=transport", {
        state: {
          editingStopId: id,
          editingStopType: stop.type, // Pass the stop type to know which step to show
          currentPickup: stops[0].address,
          currentDropoff: stops[stops.length - 1].address,
          pickupCoords: locationData?.pickupCoords,
          dropoffCoords: locationData?.dropoffCoords,
        }
      });
    }
  };

  const handleOrder = () => {
    navigate("/tracking/123", {
      state: {
        pickup: stops[0].address,
        dropoff: stops[stops.length - 1].address,
        stops: stops,
        pickupCoords: locationData?.pickupCoords,
        dropoffCoords: locationData?.dropoffCoords,
        estimatedTime: routeData 
          ? `${Math.ceil(routeData.duration / 60)} menit`
          : "Menghitung...",
        distance: routeData 
          ? `${(routeData.distance / 1000).toFixed(1)} km`
          : "Menghitung...",
        price: routeData?.price || 0,
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
        intermediateStops={stops.slice(1, -1).filter(s => s.coords).map(s => s.coords!)} // Pass intermediate stops with coords
        showPickupMarker={true}
        showDropoffMarker={true}
        autoFitBounds={true}
      />
      
      {/* Content Layer */}
      <Header title="Delivery" className="relative z-10 h-32 rounded-b-3xl flex-shrink-0" />

      <div className="relative py-4 z-50 -mt-20 flex-shrink-0">
        <LocationCard
          className="mx-4"
          pickupTime="Today 14:20"
          stops={stops}
          onAddStop={handleAddStop}
          onRemoveStop={handleRemoveStop}
          onEditStop={handleEditStop}
        />
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      <div className="relative z-10 flex-shrink-0">
        <PaymentSheet
          options={[
            {
              estimatedTime: routeData 
                ? `${Math.ceil(routeData.duration / 60)} menit`
                : "Menghitung...",
              distance: routeData 
                ? `${(routeData.distance / 1000).toFixed(1)} km`
                : "Menghitung...",
              price: routeData?.price || 0,
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
