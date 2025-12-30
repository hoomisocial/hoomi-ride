import { useState, useRef, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { Header } from "@/components/layout/Header";
import { MapPlaceholder } from "@/components/tracking/MapPlaceholder";
import { MapPin, Navigation, Loader2 } from "lucide-react";

export default function LocationSelection() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const serviceType = searchParams.get("type") || "transport";

  const [step, setStep] = useState<"pickup" | "dropoff">("pickup");
  const [pickupLocation, setPickupLocation] = useState("");
  const [dropoffLocation, setDropoffLocation] = useState("");
  const [pickupCoords, setPickupCoords] = useState<[number, number] | null>(null);
  const [dropoffCoords, setDropoffCoords] = useState<[number, number] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<Array<{ name: string; coords: [number, number] }>>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  const geocodeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const stepRef = useRef<"pickup" | "dropoff">("pickup");

  // Keep stepRef in sync with step state
  useEffect(() => {
    stepRef.current = step;
  }, [step]);

  // Derive map center from current step's coordinates
  const getMapCenter = (): [number, number] => {
    if (step === "pickup") {
      return pickupCoords || [106.8456, -6.2088];
    } else {
      return dropoffCoords || pickupCoords || [106.8456, -6.2088];
    }
  };

  // Handle map movement - update location as user drags
  const handleMapMove = (newCenter: [number, number]) => {
    // Use ref to get current step value (no closure issues)
    const currentStep = stepRef.current;
    
    // Clear existing timeout first
    if (geocodeTimeoutRef.current) {
      clearTimeout(geocodeTimeoutRef.current);
    }
    
    // Only update coordinates for current step
    if (currentStep === "pickup") {
      setPickupCoords(newCenter);
      setPickupLocation("Memuat lokasi...");
    } else if (currentStep === "dropoff") {
      // In dropoff step, only update dropoff coords, never pickup
      setDropoffCoords(newCenter);
      setDropoffLocation("Memuat lokasi...");
    } else {
      return; // Don't proceed if step is invalid
    }
    
    // Debounce reverse geocoding for address name
    geocodeTimeoutRef.current = setTimeout(async () => {
      const locationName = await reverseGeocode(newCenter);
      
      // Re-check step from ref in case it changed
      const stepAtGeocode = stepRef.current;
      
      // Use ref value to ensure we update the correct location
      if (stepAtGeocode === "pickup") {
        setPickupLocation(locationName);
      } else if (stepAtGeocode === "dropoff") {
        setDropoffLocation(locationName);
      }
    }, 600);
  };

  // Reverse geocode coordinates to get location name
  const reverseGeocode = async (coords: [number, number]): Promise<string> => {
    try {
      const token = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${coords[0]},${coords[1]}.json?` +
        `access_token=${token}&` +
        `language=id` // No types restriction - get most specific result available
      );
      const data = await response.json();
      
      return data.features && data.features.length > 0 
        ? data.features[0].place_name 
        : "Lokasi Terpilih";
    } catch (error) {
      console.error("Error reverse geocoding:", error);
      return "Lokasi Terpilih";
    }
  };

  // Search location with Mapbox Geocoding API
  const searchLocation = async (query: string) => {
    if (!query || query.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    try {
      const token = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
      const center = getMapCenter();
      const proximity = `${center[0]},${center[1]}`;
      
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?` +
        `access_token=${token}&` +
        `country=ID&` +
        `language=id&` +
        `limit=15&` + // Increased limit for more options
        `proximity=${proximity}` // No types restriction - show all relevant results
      );
      const data = await response.json();
      
      if (data.features && data.features.length > 0) {
        const results = data.features.map((feature: any) => ({
          name: feature.place_name,
          coords: [feature.center[0], feature.center[1]] as [number, number],
        }));
        setSuggestions(results);
        setShowSuggestions(true);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
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
    // Update coordinates and location name
    if (step === "pickup") {
      setPickupCoords(coords);
      setPickupLocation(name);
    } else {
      setDropoffCoords(coords);
      setDropoffLocation(name);
    }
    
    setSuggestions([]);
    setShowSuggestions(false);
  };

  const handleCurrentLocation = () => {
    if ("geolocation" in navigator) {
      setIsLoading(true);
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { longitude, latitude } = position.coords;
          const coords: [number, number] = [longitude, latitude];
          
          // Set coordinates first
          if (step === "pickup") {
            setPickupCoords(coords);
            setPickupLocation("Mengambil alamat...");
          } else {
            setDropoffCoords(coords);
            setDropoffLocation("Mengambil alamat...");
          }
          
          // Then get address name
          const locationName = await reverseGeocode(coords);
          
          if (step === "pickup") {
            setPickupLocation(locationName);
          } else {
            setDropoffLocation(locationName);
          }
          
          setIsLoading(false);
        },
        (error) => {
          console.error("Error getting location:", error);
          alert("Tidak dapat mengakses lokasi Anda. Pastikan GPS aktif dan izin lokasi diberikan.");
          setIsLoading(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    } else {
      alert("Browser Anda tidak mendukung geolocation.");
    }
  };

  const handleConfirmLocation = () => {
    if (step === "pickup") {
      if (!pickupLocation || !pickupCoords) {
        alert("Silakan pilih lokasi penjemputan terlebih dahulu");
        return;
      }
      
      // Transition to dropoff step
      setStep("dropoff");
      
      // If dropoff not set yet, initialize with offset from pickup and trigger geocoding
      if (!dropoffCoords && pickupCoords) {
        const offsetCoords: [number, number] = [
          pickupCoords[0] + 0.003, // ~300m offset
          pickupCoords[1] - 0.003
        ];
        setDropoffCoords(offsetCoords);
        setDropoffLocation("Memuat lokasi..."); // Show loading state
        
        // Immediately reverse geocode the offset location
        reverseGeocode(offsetCoords).then((locationName) => {
          setDropoffLocation(locationName);
        });
      }
    } else {
      if (!dropoffLocation || !dropoffCoords) {
        alert("Silakan pilih lokasi tujuan terlebih dahulu");
        return;
      }
      
      if (!pickupCoords) {
        alert("Lokasi penjemputan tidak valid");
        return;
      }
      
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

  const handleBack = () => {
    if (step === "dropoff") {
      // Go back to pickup step and clear dropoff selection
      setStep("pickup");
      setDropoffCoords(null);
      setDropoffLocation("");
    } else {
      navigate(-1);
    }
  };

  const isCurrentStep = (stepName: "pickup" | "dropoff") => step === stepName;
  const canProceed = step === "pickup" 
    ? !!(pickupLocation && pickupCoords)
    : !!(dropoffLocation && dropoffCoords);

  const getHeaderTitle = () => {
    return step === "pickup" ? "Pilih Lokasi Penjemputan" : "Pilih Lokasi Tujuan";
  };

  return (
    <MobileLayout className="relative flex flex-col h-screen">
      {/* Fullscreen Map Background */}
      <div className="absolute inset-0 w-full h-full" style={{ touchAction: 'none' }}>
        <MapPlaceholder 
          className="w-full h-full" 
          center={getMapCenter()}
          pickupCoordinates={pickupCoords}
          dropoffCoordinates={dropoffCoords}
          onMapMove={handleMapMove}
          showPickupMarker={step === "pickup"} // Only show pickup marker in pickup step
          showDropoffMarker={step === "dropoff"} // Only show dropoff marker in dropoff step
        />
      </div>
      
      {/* Content Layer */}
      <Header
        title={getHeaderTitle()}
        className="relative z-10 rounded-b-3xl flex-shrink-0"
        onBack={handleBack}
      />

      {/* Map Controls Overlay */}
      <div className="relative z-10 flex-1 pointer-events-none">
        {/* Current Location Button */}
        <button
          onClick={handleCurrentLocation}
          disabled={isLoading}
          className="absolute top-4 right-4 z-10 p-3 rounded-full bg-card shadow-lg disabled:opacity-50 pointer-events-auto"
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
            ? "Geser peta atau cari lokasi penjemputan"
            : "Geser peta atau cari lokasi tujuan"}
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
              onFocus={(e) => {
                e.target.select(); // Select all text on focus
                if (suggestions.length > 0) setShowSuggestions(true);
              }}
              className="flex-1 bg-transparent outline-none text-foreground placeholder:text-muted-foreground"
            />
          </div>

          {/* Suggestions Dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute bottom-full left-0 right-0 mb-2 bg-card rounded-xl shadow-lg border border-border max-h-60 overflow-y-auto z-50">
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
              onClick={() => {
                setStep("pickup");
                setDropoffCoords(null);
                setDropoffLocation("");
              }}
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
