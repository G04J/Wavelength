"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

export type Position = { lat: number; lng: number };

export type LocationStatus =
  | "idle"       // not watching yet
  | "prompt"     // waiting for user to allow
  | "watching"   // got at least one position
  | "denied"     // user denied
  | "unavailable"; // no geolocation support or error

type LocationContextValue = {
  position: Position | null;
  error: string | null;
  status: LocationStatus;
  /** Call when this part of the app needs continuous location (e.g. Discover page). */
  enableWatching: () => void;
  /** Restart location request (e.g. after timeout or temporary error). */
  retry: () => void;
};

const LocationContext = createContext<LocationContextValue | null>(null);

const defaultValue: LocationContextValue = {
  position: null,
  error: null,
  status: "idle",
  enableWatching: () => {},
  retry: () => {},
};

const geoOptions: PositionOptions = {
  enableHighAccuracy: true,
  maximumAge: 15_000,   // allow cache up to 15s for faster first result
  timeout: 30_000,     // 30s so GPS can get a fix indoors
};

function getLocationErrorMessage(code: number, message: string): string {
  switch (code) {
    case 1:
      return "Location access was denied.";
    case 2:
      return "Location is temporarily unavailable. Try moving to a spot with better signal.";
    case 3:
      return "Location took too long. Try again — and try near a window or outdoors for a faster fix.";
    default:
      return message || "Could not get location.";
  }
}

export function LocationProvider({ children }: { children: ReactNode }) {
  const [position, setPosition] = useState<Position | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<LocationStatus>("idle");
  const [watchingEnabled, setWatchingEnabled] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const watchIdRef = useRef<number | null>(null);

  const enableWatching = useCallback(() => {
    console.log("[Location] enableWatching()");
    setWatchingEnabled(true);
  }, []);

  const retry = useCallback(() => {
    console.log("[Location] retry()");
    setError(null);
    setStatus("prompt");
    setRetryCount((c) => c + 1);
  }, []);

  useEffect(() => {
    if (!watchingEnabled || typeof window === "undefined" || !navigator?.geolocation) {
      if (watchingEnabled && typeof window !== "undefined" && !navigator?.geolocation) {
        setStatus("unavailable");
        setError("Geolocation is not supported by this browser.");
      }
      return;
    }

    setError(null);
    setStatus("prompt");
    console.log("[Location] watchPosition started (prompt)");

    const onSuccess = (event: GeolocationPosition) => {
      const pos = { lat: event.coords.latitude, lng: event.coords.longitude };
      console.log("[Location] position update", { lat: pos.lat.toFixed(4), lng: pos.lng.toFixed(4) });
      setPosition(pos);
      setError(null);
      setStatus("watching");
    };

    const onError = (event: GeolocationPositionError) => {
      console.log("[Location] error", { code: event.code, message: event.message });
      if (event.code === 1) {
        setStatus("denied");
        setError("Location access was denied.");
      } else {
        setStatus("unavailable");
        setError(getLocationErrorMessage(event.code, event.message));
      }
    };

    watchIdRef.current = navigator.geolocation.watchPosition(
      onSuccess,
      onError,
      geoOptions
    );

    return () => {
      console.log("[Location] watchPosition cleared");
      if (watchIdRef.current != null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      setPosition(null);
      setError(null);
      setStatus("idle");
    };
  }, [watchingEnabled, retryCount]);

  const value: LocationContextValue = {
    position,
    error,
    status,
    enableWatching,
    retry,
  };

  return (
    <LocationContext.Provider value={value}>
      {children}
    </LocationContext.Provider>
  );
}

export function useLiveLocation(): LocationContextValue {
  const ctx = useContext(LocationContext);
  return ctx ?? defaultValue;
}
