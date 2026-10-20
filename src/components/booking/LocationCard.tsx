import { Circle, MapPin, Plus, X, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

interface Stop {
  id: string;
  type: "pickup" | "dropoff";
  address: string;
  detail: string;
  coords?: [number, number];
  contact?: string;
}

interface LocationCardProps {
  pickupTime: string;
  deliveryTime?: string;
  stops: Stop[];
  onAddStop?: () => void;
  onRemoveStop?: (id: string) => void;
  onEditStop?: (id: string) => void;
  className?: string;
}

export function LocationCard({
  pickupTime,
  deliveryTime,
  stops,
  onAddStop,
  onRemoveStop,
  onEditStop,
  className = "",
}: LocationCardProps) {
  const [showPickup, setShowPickup] = useState(true);
  const pickupStop = stops.find((s) => s.type === "pickup");
  const dropoffStops = stops.filter((s) => s.type === "dropoff");

  return (
    <div
      className={`card-shadow rounded-2xl bg-card ${
        showPickup ? "p-4" : "p-3"
      } ${className}`}
    >
      {/* Time Header - Only show when expanded */}
      {showPickup && (
        <div className="mb-4 flex border-b border-border pb-3">
          <button
            onClick={() => setShowPickup(!showPickup)}
            className="flex-1 text-left flex items-center justify-between"
          >
            <div>
              <p className="text-sm font-semibold text-primary">Pick up</p>
              <p className="text-xs text-muted-foreground">{pickupTime}</p>
            </div>
            <ChevronUp className="h-5 w-5 text-primary" />
          </button>
        </div>
      )}

      {/* Collapsed Header - Show when hidden */}
      {!showPickup && (
        <button onClick={() => setShowPickup(!showPickup)} className="w-full">
          <div className="flex items-start gap-3">
            {/* Icon Column */}
            <div className="flex flex-col items-center pt-1">
              <Circle className="h-3 w-3 fill-primary text-primary" />
              <div className="my-1 h-8 w-px border-l-2 border-dashed border-primary/30" />
              <MapPin className="h-3 w-3 text-primary" />
            </div>

            {/* Content Column */}
            <div className="flex-1 text-left space-y-2">
              <div>
                <p className="text-xs text-muted-foreground">Pick-up</p>
                <p className="text-sm font-medium text-foreground line-clamp-1">
                  {pickupStop?.address || "Lokasi Penjemputan"}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Drop-off</p>
                <p className="text-sm font-medium text-foreground line-clamp-1">
                  {dropoffStops[0]?.address || "Lokasi Tujuan"}
                </p>
              </div>
            </div>

            {/* Expand Icon */}
            <ChevronDown className="h-5 w-5 text-primary flex-shrink-0 mt-2" />
          </div>
        </button>
      )}

      {/* Stops */}
      <div className="relative">
        {showPickup && (
          <>
            {/* Pickup Stop - Collapsible */}
            {pickupStop && (
              <div className="relative flex gap-3 pb-4">
                <div className="flex flex-col items-center">
                  <Circle className="h-4 w-4 fill-primary text-primary" />
                  {dropoffStops.length > 0 && (
                    <div className="my-1 h-full w-px border-l-2 border-dashed border-primary/30" />
                  )}
                </div>
                <div className="flex-1">
                  <button
                    onClick={() => onEditStop?.(pickupStop.id)}
                    className="w-full text-left"
                  >
                    <p className="font-medium text-foreground">
                      Pick-up location
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {pickupStop.address || "Detail location"}
                    </p>
                  </button>
                </div>
              </div>
            )}

            {/* Dropoff Stops */}
            {dropoffStops.map((stop, index) => (
              <div key={stop.id} className="relative flex gap-3 pb-4 last:pb-0">
                <div className="flex flex-col items-center">
                  <MapPin className="h-4 w-4 text-primary" />
                  {index < dropoffStops.length - 1 && (
                    <div className="my-1 h-full w-px border-l-2 border-dashed border-primary/30" />
                  )}
                </div>
                <div className="flex-1">
                  <button
                    onClick={() => onEditStop?.(stop.id)}
                    className="w-full text-left"
                  >
                    <p className="font-medium text-foreground">
                      Drop-off location
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {stop.address || "Detail location"}
                    </p>
                  </button>
                </div>
                {dropoffStops.length > 1 && (
                  <button
                    onClick={() => onRemoveStop?.(stop.id)}
                    className="self-start text-muted-foreground hover:text-destructive"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </>
        )}
      </div>

      {/* Add Stop Button - Only show when expanded */}
      {showPickup && (
        <button
          onClick={onAddStop}
          className="mt-4 flex w-full items-center justify-center gap-2 text-sm font-medium text-primary"
        >
          <Plus className="h-4 w-4" />
          Add Stop
        </button>
      )}
    </div>
  );
}
