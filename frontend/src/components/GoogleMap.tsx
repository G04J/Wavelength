"use client";

import { useEffect, useRef, useState } from "react";

type Position = { lat: number; lng: number };

const DEFAULT_CENTER = { lat: 37.7749, lng: -122.4194 };
const DEFAULT_ZOOM = 15;

type Props = {
  /** Current user position; map centers here and shows a marker. */
  position: Position | null;
  /** Height of the map container (CSS value). */
  height?: string;
  /** Optional Google Maps API key. If missing, map is not loaded. */
  apiKey?: string;
};

/**
 * Renders a Google Map with a marker at the given position.
 * Loads the Maps JavaScript API script when apiKey is provided.
 */
export function GoogleMap({ position, height = "320px", apiKey }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [scriptError, setScriptError] = useState<string | null>(null);

  // Load Google Maps script once
  useEffect(() => {
    if (!apiKey || typeof window === "undefined") return;
    if (window.google?.maps) {
      setScriptLoaded(true);
      return;
    }
    const existing = document.querySelector('script[src*="maps.googleapis.com"]');
    if (existing) {
      existing.addEventListener("load", () => setScriptLoaded(true));
      return;
    }
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}`;
    script.async = true;
    script.defer = true;
    script.onload = () => setScriptLoaded(true);
    script.onerror = () => setScriptError("Failed to load Google Maps.");
    document.head.appendChild(script);
  }, [apiKey]);

  // Create map when script is loaded and we have a container (ref is set after mount)
  useEffect(() => {
    if (!scriptLoaded || !window.google?.maps) return;
    const container = containerRef.current;
    if (!container) return;

    const center = position ?? DEFAULT_CENTER;
    const map = new google.maps.Map(container, {
      center: { lat: center.lat, lng: center.lng },
      zoom: DEFAULT_ZOOM,
      disableDefaultUI: false,
      zoomControl: true,
      mapTypeControl: true,
      fullscreenControl: true,
    });
    mapRef.current = map;

    return () => {
      markerRef.current = null;
      mapRef.current = null;
    };
  }, [scriptLoaded]);

  // Update marker and center when position changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !window.google?.maps) return;

    if (position) {
      const latLng = { lat: position.lat, lng: position.lng };
      if (!markerRef.current) {
        markerRef.current = new google.maps.Marker({
          position: latLng,
          map,
          title: "You",
        });
      } else {
        markerRef.current.setPosition(latLng);
      }
      map.panTo(latLng);
    } else {
      if (markerRef.current) {
        markerRef.current.setMap(null);
        markerRef.current = null;
      }
    }
  }, [scriptLoaded, position?.lat, position?.lng, position]);

  if (!apiKey) {
    return null;
  }

  if (scriptError) {
    return (
      <div style={{ padding: "1rem", background: "#fef2f2", borderRadius: 8, color: "#c04040", fontSize: "0.875rem" }}>
        {scriptError}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      style={{
        width: "100%",
        height,
        borderRadius: 12,
        overflow: "hidden",
        background: "#e8e4e0",
      }}
      aria-hidden
    />
  );
}
