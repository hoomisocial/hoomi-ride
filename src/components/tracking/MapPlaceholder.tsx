import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

// Ganti dengan access token Mapbox Anda
const MAPBOX_ACCESS_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN || "pk.eyJ1IjoiaG9vbWktcmlkZSIsImEiOiJjbTRyZXhhbWowMDFqMmlzZ3d2OXF4cnN4In0.PLACEHOLDER";

interface MapPlaceholderProps {
  center?: [number, number]; // [lng, lat]
  pickupCoordinates?: [number, number] | null;
  dropoffCoordinates?: [number, number] | null;
  intermediateStops?: [number, number][]; // Array of intermediate stop coordinates
  driverCoordinates?: [number, number] | null; // Driver's current position
  newStopCoordinates?: [number, number] | null; // For adding new stops
  onMapMove?: (center: [number, number]) => void;
  className?: string;
  showPickupMarker?: boolean; // Control pickup marker visibility
  showDropoffMarker?: boolean; // Control dropoff marker visibility
  showDriverMarker?: boolean; // Control driver marker visibility
  showCenterMarker?: boolean; // Control center marker visibility for adding new stops
  showNewStopMarker?: boolean; // Control new stop marker visibility
  autoFitBounds?: boolean; // Auto fit map to show entire route
}

export function MapPlaceholder({
  center = [106.8456, -6.2088], // Default: Jakarta
  pickupCoordinates = null,
  dropoffCoordinates = null,
  intermediateStops = [],
  driverCoordinates = null,
  newStopCoordinates = null,
  onMapMove,
  className = "",
  showPickupMarker = true,
  showDropoffMarker = true,
  showDriverMarker = false,
  showCenterMarker = false,
  showNewStopMarker = false,
  autoFitBounds = false,
}: MapPlaceholderProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const pickupMarker = useRef<mapboxgl.Marker | null>(null);
  const dropoffMarker = useRef<mapboxgl.Marker | null>(null);
  const intermediateMarkers = useRef<mapboxgl.Marker[]>([]);
  const driverMarker = useRef<mapboxgl.Marker | null>(null);
  const newStopMarker = useRef<mapboxgl.Marker | null>(null);
  const centerMarker = useRef<mapboxgl.Marker | null>(null);
  const isUpdatingFromProp = useRef(false);
  const previousCenter = useRef<[number, number]>(center);
  const routeDrawn = useRef(false);
  
  // Route mode: both coordinates exist
  const isRouteMode = pickupCoordinates && dropoffCoordinates;

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    mapboxgl.accessToken = MAPBOX_ACCESS_TOKEN;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: center,
      zoom: 15,
      attributionControl: false,
      interactive: true,
      scrollZoom: true,
      dragPan: true,
      dragRotate: false,
      touchZoomRotate: true,
      touchPitch: false,
    });

    map.current.addControl(
      new mapboxgl.NavigationControl({ showCompass: false }),
      "top-right"
    );

    map.current.on("load", () => {
      setMapLoaded(true);
      
      // Create purple center marker if onMapMove exists (selection mode)
      if (map.current && onMapMove) {
        const centerEl = document.createElement("div");
        centerEl.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="rgb(139, 92, 246)" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.5)); display: block;">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
            <circle cx="12" cy="10" r="3" fill="white"></circle>
          </svg>
        `;
        centerEl.style.cursor = 'pointer';
        centerEl.style.zIndex = '1000';
        
        centerMarker.current = new mapboxgl.Marker({ 
          element: centerEl,
          anchor: 'bottom'
        })
          .setLngLat(map.current.getCenter())
          .addTo(map.current);
      }
    });

    // Update center marker only on drag, not on zoom or other movements
    map.current.on("drag", () => {
      if (map.current && centerMarker.current && onMapMove) {
        centerMarker.current.setLngLat(map.current.getCenter());
      }
    });

    // Listen to map movement - only fire when user drags the map (not zoom)
    map.current.on("dragend", () => {
      if (map.current && onMapMove && !isUpdatingFromProp.current) {
        // Don't trigger callback if route is being displayed (both coords exist)
        if (pickupCoordinates && dropoffCoordinates) return;
        
        const mapCenter = map.current.getCenter();
        onMapMove([mapCenter.lng, mapCenter.lat]);
      }
    });

    return () => {
      centerMarker.current?.remove();
      pickupMarker.current?.remove();
      dropoffMarker.current?.remove();
      intermediateMarkers.current.forEach(marker => marker.remove());
      driverMarker.current?.remove();
      newStopMarker.current?.remove();
      map.current?.remove();
      map.current = null;
    };
  }, []);

  // Update map center when prop changes (from parent component)
  // Skip this in route mode to prevent jumping
  useEffect(() => {
    if (!map.current || !mapLoaded || isRouteMode) return;
    
    const [newLng, newLat] = center;
    const [prevLng, prevLat] = previousCenter.current;
    
    // Calculate distance between new and previous center
    const distance = Math.sqrt(
      Math.pow(newLng - prevLng, 2) + 
      Math.pow(newLat - prevLat, 2)
    );
    
    // Skip if change is negligible (< ~1 meter)
    if (distance < 0.00001) return;
    
    // Update previous center
    previousCenter.current = center;
    
    // Set flag to prevent triggering onMapMove during programmatic update
    isUpdatingFromProp.current = true;
    
    // Get current zoom to preserve it
    const currentZoom = map.current.getZoom();
    
    // Use easeTo for smooth animation, preserve current zoom
    map.current.easeTo({
      center: [newLng, newLat],
      duration: 300,
      zoom: currentZoom // Don't change zoom
    });
    
    // Reset flag after animation
    setTimeout(() => {
      isUpdatingFromProp.current = false;
    }, 350);
  }, [center, mapLoaded, isRouteMode]);

  // Manage pickup marker
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    // Remove existing marker
    if (pickupMarker.current) {
      pickupMarker.current.remove();
      pickupMarker.current = null;
    }

    // Add new marker if coordinates are provided AND we want to show it
    if (pickupCoordinates && showPickupMarker) {
      const pickupEl = document.createElement("div");
      pickupEl.className = "pickup-marker";
      pickupEl.innerHTML = `
        <div class="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center shadow-lg border-2 border-white">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <circle cx="12" cy="12" r="3"/>
          </svg>
        </div>
      `;

      pickupMarker.current = new mapboxgl.Marker({ element: pickupEl })
        .setLngLat(pickupCoordinates)
        .addTo(map.current);
    }
  }, [mapLoaded, pickupCoordinates, showPickupMarker]);

  // Manage dropoff marker
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    // Remove existing marker
    if (dropoffMarker.current) {
      dropoffMarker.current.remove();
      dropoffMarker.current = null;
    }

    // Add new marker if coordinates are provided AND we want to show it
    if (dropoffCoordinates && showDropoffMarker) {
      const dropoffEl = document.createElement("div");
      dropoffEl.className = "dropoff-marker";
      dropoffEl.innerHTML = `
        <div class="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center shadow-lg border-2 border-white">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
            <circle cx="12" cy="10" r="3"/>
          </svg>
        </div>
      `;

      dropoffMarker.current = new mapboxgl.Marker({ element: dropoffEl })
        .setLngLat(dropoffCoordinates)
        .addTo(map.current);
    }
  }, [mapLoaded, dropoffCoordinates, showDropoffMarker]);

  // Manage intermediate stop markers (orange markers for multiple stops)
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    // Remove all existing intermediate markers
    intermediateMarkers.current.forEach(marker => marker.remove());
    intermediateMarkers.current = [];

    // Add markers for each intermediate stop
    if (intermediateStops && intermediateStops.length > 0) {
      intermediateStops.forEach((coords, index) => {
        const stopEl = document.createElement("div");
        stopEl.className = "intermediate-stop-marker";
        stopEl.innerHTML = `
          <div class="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center shadow-lg border-2 border-white">
            <span class="text-white font-bold text-sm">${index + 1}</span>
          </div>
        `;

        const marker = new mapboxgl.Marker({ element: stopEl })
          .setLngLat(coords)
          .addTo(map.current!);
        
        intermediateMarkers.current.push(marker);
      });
    }
  }, [mapLoaded, intermediateStops]);

  // Manage driver marker (motorcycle icon)
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    // Remove existing marker
    if (driverMarker.current) {
      driverMarker.current.remove();
      driverMarker.current = null;
    }

    // Add driver marker if coordinates are provided AND we want to show it
    if (driverCoordinates && showDriverMarker) {
      const driverEl = document.createElement("div");
      driverEl.className = "driver-marker";
      driverEl.innerHTML = `
        <div class="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center shadow-lg border-3 border-white animate-pulse">
          <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="7" cy="19" r="2"/>
            <circle cx="17" cy="19" r="2"/>
            <path d="M5 19h-2v-6l2-5h9l4 5h3l-2 2"/>
            <path d="M9 19h6"/>
            <path d="M19 15v4"/>
            <path d="M5 8v5"/>
            <path d="M12 8l2-3h3l2 3"/>
          </svg>
        </div>
      `;

      driverMarker.current = new mapboxgl.Marker({ element: driverEl })
        .setLngLat(driverCoordinates)
        .addTo(map.current);
    }
  }, [mapLoaded, driverCoordinates, showDriverMarker]);

  // Manage new stop marker
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    // Remove existing marker
    if (newStopMarker.current) {
      newStopMarker.current.remove();
      newStopMarker.current = null;
    }

    // Add new marker if coordinates are provided AND we want to show it
    if (newStopCoordinates && showNewStopMarker) {
      const newStopEl = document.createElement("div");
      newStopEl.className = "newstop-marker";
      newStopEl.innerHTML = `
        <div class="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center shadow-lg border-2 border-white">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="16"/>
            <line x1="8" y1="12" x2="16" y2="12"/>
          </svg>
        </div>
      `;

      newStopMarker.current = new mapboxgl.Marker({ element: newStopEl })
        .setLngLat(newStopCoordinates)
        .addTo(map.current);
    }
  }, [mapLoaded, newStopCoordinates, showNewStopMarker]);

  // Manage center marker visibility based on route mode and showCenterMarker prop
  useEffect(() => {
    if (!centerMarker.current) return;

    // Show center marker if explicitly requested (e.g., for adding new stops)
    // Or when selecting a location (showPickupMarker or showDropoffMarker is true)
    const shouldShowCenterMarker = showCenterMarker || showPickupMarker || showDropoffMarker;
    
    if (shouldShowCenterMarker) {
      centerMarker.current.getElement().style.display = 'block';
    } else {
      centerMarker.current.getElement().style.display = 'none';
    }
  }, [showPickupMarker, showDropoffMarker, showCenterMarker]);

  // Draw route between pickup, intermediate stops, and dropoff
  // NOTE: Route is STATIC - from Pickup to Dropoff, NOT from driver position
  useEffect(() => {
    if (!map.current || !mapLoaded || !pickupCoordinates || !dropoffCoordinates) return;

    const drawRoute = async () => {
      try {
        // Build coordinates string: Pickup → Intermediate Stops → Dropoff
        // DO NOT include driver position in route - driver just follows this route
        const coordinateParts: string[] = [];
        
        // Start from pickup location (NOT driver position)
        coordinateParts.push(`${pickupCoordinates[0]},${pickupCoordinates[1]}`);
        
        // Add intermediate stops
        if (intermediateStops && intermediateStops.length > 0) {
          intermediateStops.forEach(coords => {
            coordinateParts.push(`${coords[0]},${coords[1]}`);
          });
        }
        
        // End at dropoff location
        coordinateParts.push(`${dropoffCoordinates[0]},${dropoffCoordinates[1]}`);
        const coordinates = coordinateParts.join(';');
        
        console.log("Drawing route:", coordinateParts);
        
        // Fetch route from Mapbox Directions API
        const response = await fetch(
          `https://api.mapbox.com/directions/v5/mapbox/driving/${coordinates}?` +
          `geometries=geojson&` +
          `access_token=${MAPBOX_ACCESS_TOKEN}`
        );
        const data = await response.json();

        if (data.routes && data.routes.length > 0 && map.current) {
          const route = data.routes[0].geometry;

          // Remove existing route layer and source if any
          if (map.current.getLayer('route')) {
            map.current.removeLayer('route');
          }
          if (map.current.getSource('route')) {
            map.current.removeSource('route');
          }

          // Add route source
          map.current.addSource('route', {
            type: 'geojson',
            data: {
              type: 'Feature',
              properties: {},
              geometry: route
            }
          });

          // Add route layer
          map.current.addLayer({
            id: 'route',
            type: 'line',
            source: 'route',
            layout: {
              'line-join': 'round',
              'line-cap': 'round'
            },
            paint: {
              'line-color': '#8b5cf6', // Purple color
              'line-width': 5,
              'line-opacity': 0.8
            }
          });

          // Auto fit bounds if autoFitBounds prop is true
          if (autoFitBounds) {
            const coordinates = route.coordinates;
            const bounds = coordinates.reduce((bounds: mapboxgl.LngLatBounds, coord: number[]) => {
              return bounds.extend(coord as [number, number]);
            }, new mapboxgl.LngLatBounds(coordinates[0], coordinates[0]));

            // Set flag to prevent onMapMove callback during fitBounds
            isUpdatingFromProp.current = true;

            map.current.fitBounds(bounds, {
              padding: { top: 150, bottom: 250, left: 60, right: 60 },
              duration: 800
            });

            // Reset flag after animation completes
            setTimeout(() => {
              isUpdatingFromProp.current = false;
            }, 850);
          }
          
          routeDrawn.current = true;
        }
      } catch (error) {
        console.error('Error fetching route:', error);
      }
    };

    drawRoute();
  }, [mapLoaded, pickupCoordinates, dropoffCoordinates, intermediateStops, autoFitBounds]);

  return (
    <div className={className || 'relative h-64'} style={{ touchAction: 'pan-x pan-y', pointerEvents: 'auto' }}>
      <div ref={mapContainer} className="w-full h-full" style={{ touchAction: 'none', pointerEvents: 'auto' }} />
      
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
