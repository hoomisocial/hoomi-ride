import { Circle, MapPin, Plus, X } from "lucide-react";

interface Stop {
  id: string;
  type: "pickup" | "dropoff";
  address: string;
  detail: string;
  contact: string;
}

interface LocationCardProps {
  pickupTime: string;
  deliveryTime: string;
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
  return (
    <div className={`card-shadow rounded-2xl bg-card p-4 ${className}`}>
      {/* Time Header */}
      <div className="mb-4 flex border-b border-border pb-3">
        <div className="flex-1">
          <p className="text-sm font-semibold text-primary">Pick up</p>
          <p className="text-xs text-muted-foreground">{pickupTime}</p>
        </div>
        <div className="flex-1 text-right">
          <p className="text-sm font-semibold text-foreground">Deliver</p>
          <p className="text-xs text-muted-foreground">{deliveryTime}</p>
        </div>
      </div>

      {/* Stops */}
      <div className="relative">
        {stops.map((stop, index) => (
          <div key={stop.id} className="relative flex gap-3 pb-4 last:pb-0">
            {/* Connector Line */}
            <div className="flex flex-col items-center">
              {stop.type === "pickup" ? (
                <Circle className="h-4 w-4 fill-primary text-primary" />
              ) : (
                <MapPin className="h-4 w-4 text-primary" />
              )}
              {index < stops.length - 1 && (
                <div className="my-1 h-full w-px border-l-2 border-dashed border-primary/30" />
              )}
            </div>

            {/* Content */}
            <div className="flex-1">
              <button
                onClick={() => onEditStop?.(stop.id)}
                className="w-full text-left"
              >
                <p className="font-medium text-foreground">
                  {stop.type === "pickup" ? "Pick-up location" : "Drop-off location"}
                </p>
                <p className="text-sm text-muted-foreground">{stop.address || "Detail location"}</p>
                <p className="text-sm text-muted-foreground">{stop.contact || "Nama - Telp"}</p>
              </button>
            </div>

            {/* Remove button for extra stops */}
            {stop.type === "dropoff" && stops.filter(s => s.type === "dropoff").length > 1 && (
              <button
                onClick={() => onRemoveStop?.(stop.id)}
                className="self-start text-muted-foreground hover:text-destructive"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Add Stop Button */}
      <button
        onClick={onAddStop}
        className="mt-4 flex w-full items-center justify-center gap-2 text-sm font-medium text-primary"
      >
        <Plus className="h-4 w-4" />
        Add Stop
      </button>
    </div>
  );
}
