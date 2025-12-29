import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

// Ganti dengan access token Mapbox Anda
const MAPBOX_ACCESS_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN || "pk.eyJ1IjoiaG9vbWktcmlkZSIsImEiOiJjbTRyZXhhbWowMDFqMmlzZ3d2OXF4cnN4In0.PLACEHOLDER";

interface MapPlaceholderProps {
  pickupCoordinates?: [number, number]; // [lng, lat]
  dropoffCoordinates?: [number, number]; // [lng, lat]
  driverCoordinates?: [number, number]; // [lng, lat]
  className?: string;
}

export function MapPlaceholder({
  pickupCoordinates = [106.8456, -6.2088], // Default: Jakarta
  dropoffCoordinates = [106.8156, -6.2288],
  driverCoordinates = [106.8306, -6.2188],
  className = "",
}: MapPlaceholderProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    mapboxgl.accessToken = MAPBOX_ACCESS_TOKEN;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: driverCoordinates,
      zoom: 14,
      attributionControl: false,
      interactive: true, // Enable map interactions (drag, zoom, etc)
    });

    map.current.addControl(
      new mapboxgl.NavigationControl({ showCompass: false }),
      "top-right"
    );

    map.current.on("load", () => {
      setMapLoaded(true);
    });

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, []);

  // Add markers when map is loaded
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    // Pickup marker (green)
    const pickupEl = document.createElement("div");
    pickupEl.className = "pickup-marker";
    pickupEl.innerHTML = `
      <div class="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center shadow-lg border-2 border-white">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <circle cx="12" cy="12" r="3"/>
        </svg>
      </div>
    `;

    new mapboxgl.Marker({ element: pickupEl })
      .setLngLat(pickupCoordinates)
      .setPopup(new mapboxgl.Popup().setHTML("<p class='font-semibold'>Pickup Location</p>"))
      .addTo(map.current);

    // Dropoff marker (red)
    const dropoffEl = document.createElement("div");
    dropoffEl.className = "dropoff-marker";
    dropoffEl.innerHTML = `
      <div class="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center shadow-lg border-2 border-white">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
          <circle cx="12" cy="10" r="3"/>
        </svg>
      </div>
    `;

    new mapboxgl.Marker({ element: dropoffEl })
      .setLngLat(dropoffCoordinates)
      .setPopup(new mapboxgl.Popup().setHTML("<p class='font-semibold'>Dropoff Location</p>"))
      .addTo(map.current);

    // Driver marker (animated)
    const driverEl = document.createElement("div");
    driverEl.className = "driver-marker";
    driverEl.innerHTML = `
      <div class="relative">
        <div class="absolute -inset-2 bg-primary/30 rounded-full animate-ping"></div>
        <div class="relative w-10 h-10 bg-primary rounded-full flex items-center justify-center shadow-lg border-2 border-white">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9L18 10l-1.4-3.5c-.3-.7-1-1.2-1.8-1.2H9.2c-.8 0-1.5.5-1.8 1.2L6 10l-2.5 1.1C2.7 11.3 2 12.1 2 13v3c0 .6.4 1 1 1h2"/>
            <circle cx="7" cy="17" r="2"/>
            <circle cx="17" cy="17" r="2"/>
          </svg>
        </div>
      </div>
    `;

    new mapboxgl.Marker({ element: driverEl })
      .setLngLat(driverCoordinates)
      .setPopup(new mapboxgl.Popup().setHTML("<p class='font-semibold'>Driver Location</p>"))
      .addTo(map.current);

    // Draw route line
    const coordinates = [pickupCoordinates, driverCoordinates, dropoffCoordinates];
    
    if (map.current.getSource("route")) {
      (map.current.getSource("route") as mapboxgl.GeoJSONSource).setData({
        type: "Feature",
        properties: {},
        geometry: {
          type: "LineString",
          coordinates: coordinates,
        },
      });
    } else {
      map.current.addSource("route", {
        type: "geojson",
        data: {
          type: "Feature",
          properties: {},
          geometry: {
            type: "LineString",
            coordinates: coordinates,
          },
        },
      });

      map.current.addLayer({
        id: "route",
        type: "line",
        source: "route",
        layout: {
          "line-join": "round",
          "line-cap": "round",
        },
        paint: {
          "line-color": "#6366f1",
          "line-width": 4,
          "line-dasharray": [2, 1],
        },
      });
    }

    // Fit bounds to show all markers
    const bounds = new mapboxgl.LngLatBounds();
    bounds.extend(pickupCoordinates);
    bounds.extend(dropoffCoordinates);
    bounds.extend(driverCoordinates);
    
    map.current.fitBounds(bounds, {
      padding: 50,
      maxZoom: 15,
    });

  }, [mapLoaded, pickupCoordinates, dropoffCoordinates, driverCoordinates]);

  return (
    <div className={className || 'relative h-64'}>
      <div ref={mapContainer} className="w-full h-full" />
      
      {/* Loading skeleton */}
      {!mapLoaded && (
        <div className="absolute inset-0 bg-muted overflow-hidden">
          {/* Animated gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-muted via-muted-foreground/10 to-muted animate-pulse" />
          
          {/* Map-like pattern overlays */}
          <div className="absolute inset-0 opacity-20">
            {/* Road lines */}
            <div className="absolute top-1/4 left-0 right-0 h-1 bg-muted-foreground/30" />
            <div className="absolute top-1/2 left-0 right-0 h-1 bg-muted-foreground/30 rotate-12" />
            <div className="absolute top-3/4 left-0 right-0 h-1 bg-muted-foreground/30" />
            <div className="absolute left-1/4 top-0 bottom-0 w-1 bg-muted-foreground/30" />
            <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-muted-foreground/30" />
            <div className="absolute left-3/4 top-0 bottom-0 w-1 bg-muted-foreground/30" />
          </div>
          
          {/* Marker skeletons */}
          <div className="absolute top-1/3 left-1/4 w-8 h-8 rounded-full bg-muted-foreground/40 animate-pulse" />
          <div className="absolute top-2/3 right-1/3 w-8 h-8 rounded-full bg-muted-foreground/40 animate-pulse delay-150" />
          <div className="absolute bottom-1/4 left-1/2 w-10 h-10 rounded-full bg-primary/30 animate-pulse delay-300" />
        </div>
      )}
    </div>
  );
}
