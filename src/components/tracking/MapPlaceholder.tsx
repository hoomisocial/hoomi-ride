import { MapPin } from "lucide-react";

export function MapPlaceholder() {
  return (
    <div className="relative h-64 bg-muted/50">
      {/* Fake map lines */}
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 400 256" fill="none">
        <path d="M0 128 L100 100 L200 150 L300 80 L400 120" stroke="currentColor" strokeWidth="1" className="text-border" />
        <path d="M50 0 L80 256" stroke="currentColor" strokeWidth="1" className="text-border" />
        <path d="M150 0 L180 256" stroke="currentColor" strokeWidth="1" className="text-border" />
        <path d="M250 0 L220 256" stroke="currentColor" strokeWidth="1" className="text-border" />
        <path d="M350 0 L320 256" stroke="currentColor" strokeWidth="1" className="text-border" />
        <path d="M0 50 L400 80" stroke="currentColor" strokeWidth="1" className="text-border" />
        <path d="M0 180 L400 200" stroke="currentColor" strokeWidth="1" className="text-border" />
      </svg>
      
      {/* Markers */}
      <div className="absolute left-1/3 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <div className="relative">
          <div className="absolute -left-2 -top-2 h-8 w-8 animate-ping rounded-full bg-primary/20" />
          <div className="flex h-4 w-4 items-center justify-center rounded-full bg-primary">
            <div className="h-2 w-2 rounded-full bg-primary-foreground" />
          </div>
        </div>
      </div>
      
      <div className="absolute right-1/4 top-1/3">
        <MapPin className="h-6 w-6 text-foreground" />
      </div>
    </div>
  );
}
