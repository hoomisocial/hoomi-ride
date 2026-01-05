import { useState, useRef, useEffect } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { Header } from "@/components/layout/Header";
import { MapPlaceholder } from "@/components/tracking/MapPlaceholder";
import { MapPin, Navigation, Loader2 } from "lucide-react";

export default function LocationSelection() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const serviceType = searchParams.get("type") || "transport";
  
  // Check if editing existing stop or adding new stop
  const editingState = location.state as { 
    editingStopId?: string; 
    editingStopType?: "pickup" | "dropoff";
    currentPickup?: string;
    currentDropoff?: string;
    pickupCoords?: [number, number];
    dropoffCoords?: [number, number];
    addingNewStop?: boolean;
    allStops?: Array<{ id: string; type: "pickup" | "dropoff"; address: string; detail: string; coords?: [number, number] }>;
  } | null;

  // Set initial step based on editing type or adding new stop
  const initialStep = editingState?.addingNewStop ? "newstop" : (editingState?.editingStopType || "pickup");
  const [step, setStep] = useState<"pickup" | "dropoff" | "newstop">(initialStep);
  const [pickupLocation, setPickupLocation] = useState("");
  const [dropoffLocation, setDropoffLocation] = useState("");
  const [newStopLocation, setNewStopLocation] = useState("");
  const [pickupCoords, setPickupCoords] = useState<[number, number] | null>(null);
  const [dropoffCoords, setDropoffCoords] = useState<[number, number] | null>(null);
  const [newStopCoords, setNewStopCoords] = useState<[number, number] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<Array<{ name: string; coords: [number, number] }>>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  const geocodeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const stepRef = useRef<"pickup" | "dropoff" | "newstop">("pickup");

  // Keep stepRef in sync with step state
  useEffect(() => {
    stepRef.current = step;
  }, [step]);

  // Initialize coordinates from editingState when entering newstop mode
  useEffect(() => {
    if (step === "newstop" && editingState) {
      // Set pickup and dropoff from existing data
      if (editingState.pickupCoords && !pickupCoords) {
        setPickupCoords(editingState.pickupCoords);
      }
      if (editingState.dropoffCoords && !dropoffCoords) {
        setDropoffCoords(editingState.dropoffCoords);
      }
      
      // Initialize newStopCoords to midpoint if not set
      if (!newStopCoords && editingState.pickupCoords && editingState.dropoffCoords) {
        const midpoint: [number, number] = [
          (editingState.pickupCoords[0] + editingState.dropoffCoords[0]) / 2,
          (editingState.pickupCoords[1] + editingState.dropoffCoords[1]) / 2
        ];
        setNewStopCoords(midpoint);
        setNewStopLocation("Memuat lokasi...");
        
        // Reverse geocode the initial position
        reverseGeocode(midpoint).then((locationName) => {
          setNewStopLocation(locationName);
        });
      }
    }
  }, [step, editingState]);

  // Derive map center from current step's coordinates
  const getMapCenter = (): [number, number] => {
    if (step === "pickup") {
      return pickupCoords || [106.8456, -6.2088];
    } else if (step === "dropoff") {
      return dropoffCoords || pickupCoords || [106.8456, -6.2088];
    } else if (step === "newstop") {
      // Use newStopCoords if available, otherwise midpoint
      if (newStopCoords) {
        return newStopCoords;
      }
      // For new stop, default to midpoint between pickup and dropoff
      if (pickupCoords && dropoffCoords) {
        return [
          (pickupCoords[0] + dropoffCoords[0]) / 2,
          (pickupCoords[1] + dropoffCoords[1]) / 2
        ];
      }
      return pickupCoords || [106.8456, -6.2088];
    }
    return [106.8456, -6.2088];
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
    } else if (currentStep === "newstop") {
      setNewStopCoords(newCenter);
      setNewStopLocation("Memuat lokasi...");
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
      } else if (stepAtGeocode === "newstop") {
        setNewStopLocation(locationName);
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
        `limit=15&` +
        `proximity=${proximity}` // Use proximity but no type restriction for better results
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
    } else if (step === "dropoff") {
      setDropoffLocation(value);
    } else if (step === "newstop") {
      setNewStopLocation(value);
    }
    searchLocation(value);
  };

  const handleSelectSuggestion = (name: string, coords: [number, number]) => {
    // Update coordinates and location name
    if (step === "pickup") {
      setPickupCoords(coords);
      setPickupLocation(name);
    } else if (step === "dropoff") {
      setDropoffCoords(coords);
      setDropoffLocation(name);
    } else if (step === "newstop") {
      setNewStopCoords(coords);
      setNewStopLocation(name);
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
          } else if (step === "dropoff") {
            setDropoffCoords(coords);
            setDropoffLocation("Mengambil alamat...");
          } else if (step === "newstop") {
            setNewStopCoords(coords);
            setNewStopLocation("Mengambil alamat...");
          }
          
          // Then get address name
          const locationName = await reverseGeocode(coords);
          
          if (step === "pickup") {
            setPickupLocation(locationName);
          } else if (step === "dropoff") {
            setDropoffLocation(locationName);
          } else if (step === "newstop") {
            setNewStopLocation(locationName);
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
      
      // If editing pickup only, go back to transport with updated location
      if (editingState?.editingStopType === "pickup") {
        navigate(`/${serviceType}`, {
          state: {
            pickup: pickupLocation,
            dropoff: editingState.currentDropoff,
            pickupCoords: pickupCoords,
            dropoffCoords: editingState.dropoffCoords,
          },
        });
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
    } else if (step === "dropoff") {
      if (!dropoffLocation || !dropoffCoords) {
        alert("Silakan pilih lokasi tujuan terlebih dahulu");
        return;
      }
      
      // If editing dropoff only, use existing pickup data
      if (editingState?.editingStopType === "dropoff") {
        navigate(`/${serviceType}`, {
          state: {
            pickup: editingState.currentPickup,
            dropoff: dropoffLocation,
            pickupCoords: editingState.pickupCoords,
            dropoffCoords: dropoffCoords,
          },
        });
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
    } else if (step === "newstop") {
      // Adding a new stop
      if (!newStopLocation || !newStopCoords) {
        alert("Silakan pilih lokasi stop baru terlebih dahulu");
        return;
      }
      
      // Get existing stops and add new one
      const existingStops = editingState?.allStops || [];
      const newStop = {
        id: Date.now().toString(),
        type: "dropoff" as const,
        address: newStopLocation,
        detail: `${newStopCoords[1].toFixed(6)}, ${newStopCoords[0].toFixed(6)}`,
        coords: newStopCoords,
      };
      
      // Insert new stop before the last dropoff
      const updatedStops = [
        ...existingStops.slice(0, -1),
        newStop,
        existingStops[existingStops.length - 1]
      ];
      
      navigate(`/${serviceType}`, {
        state: {
          pickup: editingState?.currentPickup,
          dropoff: editingState?.currentDropoff,
          pickupCoords: editingState?.pickupCoords,
          dropoffCoords: editingState?.dropoffCoords,
          updatedStops: updatedStops,
        },
      });
    }
  };

  const handleBack = () => {
    if (step === "dropoff") {
      // If editing dropoff, go back to transport instead of pickup step
      if (editingState?.editingStopType === "dropoff") {
        navigate(-1);
        return;
      }
      
      // Go back to pickup step and clear dropoff selection
      setStep("pickup");
      setDropoffCoords(null);
      setDropoffLocation("");
    } else if (step === "newstop") {
      // Adding new stop, go back to transport
      navigate(-1);
    } else {
      navigate(-1);
    }
  };

  const isCurrentStep = (stepName: "pickup" | "dropoff") => step === stepName;
  const canProceed = step === "pickup" 
    ? !!(pickupLocation && pickupCoords)
    : step === "dropoff"
    ? !!(dropoffLocation && dropoffCoords)
    : !!(newStopLocation && newStopCoords);

  const getHeaderTitle = () => {
    return step === "pickup" ? "Pilih Lokasi Penjemputan" : step === "dropoff" ? "Pilih Lokasi Tujuan" : "Tambah Stop Baru";
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
          newStopCoordinates={newStopCoords}
          onMapMove={handleMapMove}
          showPickupMarker={step === "pickup"} // Only show pickup marker in pickup step
          showDropoffMarker={step === "dropoff"} // Only show dropoff marker in dropoff step
          showCenterMarker={step === "newstop"} // Show center marker for adding new stop
          showNewStopMarker={step === "newstop"} // Show orange marker for new stop position
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
          {step === "pickup" ? "Lokasi Penjemputan" : step === "dropoff" ? "Lokasi Tujuan" : "Tambah Stop Baru"}
        </h2>
        <p className="text-sm text-muted-foreground mb-4">
          {step === "pickup"
            ? "Geser peta atau cari lokasi penjemputan"
            : step === "dropoff" 
            ? "Geser peta atau cari lokasi tujuan"
            : "Geser peta untuk menentukan stop baru"}
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
                  : step === "dropoff"
                  ? "Cari lokasi tujuan..."
                  : "Cari lokasi stop baru..."
              }
              value={step === "pickup" ? pickupLocation : step === "dropoff" ? dropoffLocation : newStopLocation}
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
            {step === "pickup" ? "Lanjut" : step === "dropoff" ? "Konfirmasi" : "Tambah Stop"}
          </button>
        </div>
      </div>
    </MobileLayout>
  );
}
