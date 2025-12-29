import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { Header } from "@/components/layout/Header";
import { MapPlaceholder } from "@/components/tracking/MapPlaceholder";
import { MapPin, Navigation, Loader2 } from "lucide-react";

export default function LocationSelection() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const serviceType = searchParams.get("type") || "transport"; // transport or delivery

  const [step, setStep] = useState<"pickup" | "dropoff">("pickup");
  const [pickupLocation, setPickupLocation] = useState("");
  const [dropoffLocation, setDropoffLocation] = useState("");
  const [pickupCoords, setPickupCoords] = useState<[number, number]>([106.8456, -6.2088]); // Default Jakarta
  const [dropoffCoords, setDropoffCoords] = useState<[number, number]>([106.8156, -6.2288]);
  const [isLoading, setIsLoading] = useState(false);
  const [mapCenter, setMapCenter] = useState<[number, number]>([106.8456, -6.2088]);
  const [suggestions, setSuggestions] = useState<Array<{ name: string; coords: [number, number] }>>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Search location with Mapbox Geocoding API
  const searchLocation = async (query: string) => {
    if (!query || query.length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    try {
      const token = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${token}&country=ID&language=id&limit=5`
      );
      const data = await response.json();
      
      if (data.features && data.features.length > 0) {
        const results = data.features.map((feature: any) => ({
          name: feature.place_name,
          coords: [feature.center[0], feature.center[1]] as [number, number],
        }));
        setSuggestions(results);
        setShowSuggestions(true);
      }
    } catch (error) {
      console.error("Error searching location:", error);
    }
  };

  const handleLocationInput = (value: string) => {
    if (step === "pickup") {
      setPickupLocation(value);
    } else {
      setDropoffLocation(value);
    }
    searchLocation(value);
  };

  const handleSelectSuggestion = (name: string, coords: [number, number]) => {
    if (step === "pickup") {
      setPickupLocation(name);
      setPickupCoords(coords);
    } else {
      setDropoffLocation(name);
      setDropoffCoords(coords);
    }
    setMapCenter(coords);
    setSuggestions([]);
    setShowSuggestions(false);
  };

  const handleCurrentLocation = () => {
    if ("geolocation" in navigator) {
      setIsLoading(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { longitude, latitude } = position.coords;
          const coords: [number, number] = [longitude, latitude];
          setMapCenter(coords);
          // For now, just set a default location name
          if (step === "pickup") {
            setPickupLocation("Lokasi Saat Ini");
            setPickupCoords(coords);
          } else {
            setDropoffLocation("Lokasi Saat Ini");
            setDropoffCoords(coords);
          }
          setIsLoading(false);
        },
        (error) => {
          console.error("Error getting location:", error);
          alert("Tidak dapat mengakses lokasi Anda. Pastikan GPS aktif dan izin lokasi diberikan.");
          setIsLoading(false);
        }
      );
    } else {
      alert("Browser Anda tidak mendukung geolocation.");
    }
  };

  const handleConfirmLocation = () => {
    if (step === "pickup" && pickupLocation) {
      setStep("dropoff");
      // Reset map center to different location for dropoff
      setMapCenter([pickupCoords[0] + 0.01, pickupCoords[1] - 0.01]);
    } else if (step === "dropoff" && dropoffLocation) {
      // Navigate to the appropriate service page
      navigate(`/${serviceType}`, {
        state: {
          pickup: pickupLocation,
          dropoff: dropoffLocation,
          pickupCoords: pickupCoords,
          dropoffCoords: dropoffCoords,
        },
      });
    }
  };

  const isCurrentStep = (stepName: "pickup" | "dropoff") => step === stepName;
  const canProceed = step === "pickup" ? pickupLocation : dropoffLocation;

  const getHeaderTitle = () => {
    if (step === "pickup") {
      return "Pilih Lokasi Penjemputan";
    }
    return "Pilih Lokasi Tujuan";
  };

  return (
    <MobileLayout className="relative flex flex-col h-screen">
      {/* Fullscreen Map Background */}
      <MapPlaceholder 
        className="absolute inset-0 w-full h-full z-0" 
        pickupCoordinates={pickupCoords}
        dropoffCoordinates={dropoffCoords}
        driverCoordinates={mapCenter}
      />
      
      {/* Content Layer */}
      <Header
        title={getHeaderTitle()}
        className="relative z-10 rounded-b-3xl flex-shrink-0"
        onBack={() => (step === "dropoff" ? setStep("pickup") : navigate(-1))}
      />

      {/* Map Controls Overlay */}
      <div className="relative z-10 flex-1">
        {/* Center Pin */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-full z-10">
          <MapPin
            className="h-12 w-12 text-primary drop-shadow-lg animate-bounce"
            fill="currentColor"
          />
        </div>

        {/* Current Location Button */}
        <button
          onClick={handleCurrentLocation}
          disabled={isLoading}
          className="absolute top-4 right-4 z-10 p-3 rounded-full bg-card shadow-lg disabled:opacity-50"
        >
          {isLoading ? (
            <Loader2 className="h-5 w-5 text-primary animate-spin" />
          ) : (
            <Navigation className="h-5 w-5 text-primary" />
          )}
        </button>
      </div>

      {/* Bottom Sheet */}
      <div className="relative z-10 flex-shrink-0 rounded-t-3xl bg-card card-shadow p-6 safe-bottom">
        {/* Steps Indicator */}
        <div className="flex items-center gap-2 mb-4">
          <div
            className={`flex-1 h-1 rounded-full transition-colors ${
              isCurrentStep("pickup") ? "bg-primary" : "bg-primary/30"
            }`}
          />
          <div
            className={`flex-1 h-1 rounded-full transition-colors ${
              isCurrentStep("dropoff") ? "bg-primary" : "bg-muted"
            }`}
          />
        </div>

        {/* Title */}
        <h2 className="text-xl font-bold text-foreground mb-2">
          {step === "pickup" ? "Lokasi Penjemputan" : "Lokasi Tujuan"}
        </h2>
        <p className="text-sm text-muted-foreground mb-4">
          {step === "pickup"
            ? "Geser peta untuk memilih lokasi penjemputan"
            : "Geser peta untuk memilih lokasi tujuan"}
        </p>

        {/* Location Input */}
        <div className="mb-4 relative">
          <div className="flex items-center gap-3 p-4 rounded-xl bg-muted/50 border border-border">
            <MapPin className="h-5 w-5 text-primary flex-shrink-0" />
            <input
              type="text"
              placeholder={
                step === "pickup"
                  ? "Cari lokasi penjemputan..."
                  : "Cari lokasi tujuan..."
              }
              value={step === "pickup" ? pickupLocation : dropoffLocation}
              onChange={(e) => handleLocationInput(e.target.value)}
              onFocus={() => {
                if (suggestions.length > 0) setShowSuggestions(true);
              }}
              className="flex-1 bg-transparent outline-none text-foreground placeholder:text-muted-foreground"
            />
          </div>

          {/* Suggestions Dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-card rounded-xl shadow-lg border border-border max-h-60 overflow-y-auto z-50">
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleSelectSuggestion(suggestion.name, suggestion.coords)}
                  className="w-full text-left px-4 py-3 hover:bg-muted/50 flex items-start gap-3 transition-colors border-b border-border last:border-b-0"
                >
                  <MapPin className="h-4 w-4 text-primary flex-shrink-0 mt-1" />
                  <span className="text-sm text-foreground">{suggestion.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Summary if pickup is set and on dropoff step */}
        {step === "dropoff" && pickupLocation && (
          <div className="mb-4 p-3 rounded-xl bg-primary/5 border border-primary/20">
            <p className="text-xs text-muted-foreground mb-1">
              Lokasi Penjemputan:
            </p>
            <p className="text-sm font-medium text-foreground">
              {pickupLocation}
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 mb-4">
          {step === "dropoff" && (
            <button
              onClick={() => setStep("pickup")}
              className="px-6 py-3 rounded-full border-2 border-primary text-primary font-semibold"
            >
              Kembali
            </button>
          )}
          <button
            onClick={handleConfirmLocation}
            disabled={!canProceed}
            className="flex-1 btn-shadow rounded-full bg-primary py-3 text-center font-semibold text-primary-foreground disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {step === "pickup" ? "Lanjut" : "Konfirmasi"}
          </button>
        </div>
      </div>
    </MobileLayout>
  );
}
