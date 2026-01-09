import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { Header } from "@/components/layout/Header";
import { PackageDetails } from "@/components/booking/PackageDetails";
import { PaymentSheet } from "@/components/booking/PaymentSheet";

interface Stop {
  id: string;
  type: "pickup" | "dropoff";
  address: string;
  detail: string;
  contact?: string;
  coords?: [number, number];
}

const MAPBOX_ACCESS_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

const DeliveryDetails = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Receive data from Delivery page
  const deliveryState = location.state as {
    stops?: Stop[];
    pickupCoords?: [number, number];
    dropoffCoords?: [number, number];
  } | null;

  const [routeInfo, setRouteInfo] = useState<{
    distance: string;
    duration: string;
    price: number;
  } | null>(null);
  
  const [packageDetails, setPackageDetails] = useState<{
    weight: string;
    dimensions: string;
    description: string;
  } | null>(null);

  const stops = deliveryState?.stops || [];
  const pickupCoords = deliveryState?.pickupCoords;
  const dropoffCoords = deliveryState?.dropoffCoords;

  // Calculate route when page loads
  useEffect(() => {
    const calculateRoute = async () => {
      if (!pickupCoords || !dropoffCoords) return;

      try {
        // Build coordinates string including intermediate stops
        const allCoords: [number, number][] = [pickupCoords];
        
        // Add intermediate stops
        stops.slice(1, -1).forEach(stop => {
          if (stop.coords) {
            allCoords.push(stop.coords);
          }
        });
        
        allCoords.push(dropoffCoords);

        const coordsString = allCoords.map(c => `${c[0]},${c[1]}`).join(';');

        const response = await fetch(
          `https://api.mapbox.com/directions/v5/mapbox/driving/${coordsString}?` +
          `access_token=${MAPBOX_ACCESS_TOKEN}`
        );
        const data = await response.json();

        if (data.routes && data.routes.length > 0) {
          const route = data.routes[0];
          const distanceKm = (route.distance / 1000).toFixed(1);
          const durationMin = Math.ceil(route.duration / 60);
          
          // Calculate price based on distance (base: Rp 5000 + Rp 2500/km)
          const price = 5000 + Math.ceil(parseFloat(distanceKm) * 2500);

          setRouteInfo({
            distance: `${distanceKm} km`,
            duration: `${durationMin} menit`,
            price,
          });
        }
      } catch (error) {
        console.error("Error calculating route:", error);
        // Set default values on error
        setRouteInfo({
          distance: "-- km",
          duration: "-- menit",
          price: 15000,
        });
      }
    };

    calculateRoute();
  }, [pickupCoords, dropoffCoords, stops]);

  const handlePackageComplete = (details: { weight: string; dimensions: string; description: string }) => {
    setPackageDetails(details);
  };

  const handleOrder = () => {
    if (!routeInfo) {
      alert("Mohon tunggu perhitungan rute selesai");
      return;
    }

    // Get pickup and dropoff addresses
    const pickupStop = stops.find(s => s.type === "pickup");
    const dropoffStop = stops.find(s => s.type === "dropoff");

    // Navigate to Tracking with all order data
    navigate("/tracking/delivery", {
      state: {
        pickup: pickupStop?.address || "Lokasi Penjemputan",
        dropoff: dropoffStop?.address || "Lokasi Tujuan",
        stops,
        pickupCoords,
        dropoffCoords,
        estimatedTime: routeInfo.duration,
        distance: routeInfo.distance,
        price: routeInfo.price,
        packageDetails,
        orderType: "delivery",
      },
    });
  };

  // If no stops data, redirect back
  if (!deliveryState?.stops || stops.length === 0) {
    return (
      <MobileLayout className="bg-background">
        <Header title="Detail pengiriman paket" />
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-muted-foreground mb-4">Data pengiriman tidak ditemukan</p>
            <button
              onClick={() => navigate("/delivery")}
              className="px-6 py-2 bg-primary text-primary-foreground rounded-full"
            >
              Kembali ke Delivery
            </button>
          </div>
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout className="bg-background">
      <Header title="Detail pengiriman paket" />
      
      {/* Route Summary */}
      <div className="px-4 py-3 bg-primary/5 border-b border-primary/10">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Rute Pengiriman</p>
            <p className="font-medium text-foreground">
              {stops.find(s => s.type === "pickup")?.address?.split(",")[0] || "Pickup"} → {stops.find(s => s.type === "dropoff")?.address?.split(",")[0] || "Dropoff"}
            </p>
          </div>
          {routeInfo && (
            <div className="text-right">
              <p className="text-sm text-muted-foreground">{routeInfo.distance}</p>
              <p className="text-sm font-medium text-primary">{routeInfo.duration}</p>
            </div>
          )}
        </div>
        {stops.length > 2 && (
          <p className="text-xs text-muted-foreground mt-1">
            + {stops.length - 2} stop tambahan
          </p>
        )}
      </div>
      
      <div className="py-4">
        <PackageDetails onComplete={handlePackageComplete} />
      </div>

      <PaymentSheet
        options={routeInfo ? [
          { 
            estimatedTime: routeInfo.duration, 
            distance: routeInfo.distance, 
            price: routeInfo.price 
          },
        ] : [
          { estimatedTime: "Menghitung...", distance: "-- km", price: 0 },
        ]}
        walletBalance={50000}
        onOrder={handleOrder}
      />
    </MobileLayout>
  );
};

export default DeliveryDetails;
