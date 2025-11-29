'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { MapPin, Navigation } from 'lucide-react';
import { useTheme } from 'next-themes';
import 'leaflet/dist/leaflet.css';
import { cn } from '@/lib/utils';
import type * as Leaflet from 'leaflet';

interface LocationPickerProps {
  onLocationSelect?: (location: { lat: number; lng: number; address: string; radius: number }) => void;
  defaultLocation?: { lat: number; lng: number; address: string };
  defaultRadius?: number;
}

export function LocationPicker({ 
  onLocationSelect, 
  defaultLocation = { lat: 48.8566, lng: 2.3522, address: 'Paris, France' }, // Default to Paris
  defaultRadius = 3000 
}: LocationPickerProps) {
  const [location, setLocation] = useState(defaultLocation);
  const [radius, setRadius] = useState(defaultRadius);
  const [address, setAddress] = useState(defaultLocation.address);
  const [isMapReady, setIsMapReady] = useState(false);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<Leaflet.Map | null>(null);
  const markerRef = useRef<Leaflet.Marker | null>(null);
  const circleRef = useRef<Leaflet.Circle | null>(null);
  const leafletRef = useRef<typeof Leaflet | null>(null);
  
  const { resolvedTheme } = useTheme();

  // Load Leaflet
  useEffect(() => {
    const loadLeaflet = async () => {
      if (typeof window !== 'undefined' && !leafletRef.current) {
         const L = await import('leaflet');
         leafletRef.current = L;
         setIsMapReady(true);
      }
    };
    loadLeaflet();
  }, []);

  // Initialize Map
  useEffect(() => {
    if (!isMapReady || !mapContainerRef.current || mapRef.current) return;

    const L = leafletRef.current!;
    const map = L.map(mapContainerRef.current).setView([location.lat, location.lng], 13);
    
    // Add tiles (CartoCDN for clean look)
    const isDark = resolvedTheme === 'dark';
    const tileUrl = isDark 
      ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
      : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';
      
    L.tileLayer(tileUrl, {
      attribution: '&copy; OpenStreetMap, &copy; CARTO',
      maxZoom: 20,
    }).addTo(map);

    // Add draggable marker
    const icon = L.divIcon({
      html: `<div class="w-8 h-8 bg-primary rounded-full border-4 border-background shadow-lg flex items-center justify-center text-primary-foreground"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg></div>`,
      className: 'custom-pin-icon',
      iconSize: [32, 32],
      iconAnchor: [16, 32],
    });

    const marker = L.marker([location.lat, location.lng], { 
      draggable: true,
      icon: icon 
    }).addTo(map);

    // Add radius circle
    const circle = L.circle([location.lat, location.lng], {
      radius: radius,
      color: 'hsl(var(--primary))',
      fillColor: 'hsl(var(--primary))',
      fillOpacity: 0.1,
      weight: 1
    }).addTo(map);

    markerRef.current = marker;
    circleRef.current = circle;
    mapRef.current = map;

    // Event listeners
    marker.on('dragend', async (e) => {
      const marker = e.target;
      const position = marker.getLatLng();
      updateLocation(position.lat, position.lng);
    });

    map.on('click', (e) => {
      const { lat, lng } = e.latlng;
      marker.setLatLng([lat, lng]);
      circle.setLatLng([lat, lng]);
      updateLocation(lat, lng);
    });
    
    // Invalidate size after render to fix layout
    setTimeout(() => map.invalidateSize(), 200);

  }, [isMapReady, resolvedTheme]);

  // Update map when location changes externally
  useEffect(() => {
    if (!mapRef.current || !markerRef.current || !circleRef.current) return;
    const L = leafletRef.current!;
    
    const map = mapRef.current;
    const marker = markerRef.current;
    const circle = circleRef.current;
    
    const currentLatLng = marker.getLatLng();
    if (currentLatLng.lat !== location.lat || currentLatLng.lng !== location.lng) {
       const newLatLng = new L.LatLng(location.lat, location.lng);
       marker.setLatLng(newLatLng);
       circle.setLatLng(newLatLng);
       map.panTo(newLatLng);
    }
  }, [location]);

  // Update radius circle
  useEffect(() => {
    if (circleRef.current) {
      circleRef.current.setRadius(radius);
    }
  }, [radius]);

  const updateLocation = async (lat: number, lng: number) => {
    // In a real app, reverse geocode here
    // const res = await fetch(`...`)
    const newAddress = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    
    setLocation({ lat, lng, address: newAddress });
    setAddress(newAddress); // Or fetched address
    
    if (onLocationSelect) {
      onLocationSelect({ lat, lng, address: newAddress, radius });
    }
  };

  const handleCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        const { latitude, longitude } = position.coords;
        updateLocation(latitude, longitude);
        mapRef.current?.setView([latitude, longitude], 14);
      });
    }
  };

  return (
    <div className="space-y-4 w-full">
      <div className="flex gap-2">
        <Input 
          value={address} 
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Rechercher une ville ou un quartier..." 
          className="flex-1"
        />
        <Button variant="outline" size="icon" onClick={handleCurrentLocation}>
          <Navigation className="h-4 w-4" />
        </Button>
      </div>

      <div className="relative w-full h-[300px] rounded-lg overflow-hidden border bg-muted">
        <div ref={mapContainerRef} className="w-full h-full z-0" />
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Rayon de recherche</span>
          <span>{radius < 1000 ? `${radius}m` : `${(radius/1000).toFixed(1)}km`}</span>
        </div>
        <Slider 
          value={[radius]} 
          max={20000} 
          min={500} 
          step={100}
          onValueChange={(vals) => {
            setRadius(vals[0]);
            if (onLocationSelect) {
              onLocationSelect({ ...location, radius: vals[0] });
            }
          }} 
        />
      </div>
    </div>
  );
}
