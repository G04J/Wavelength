"use client";

import { useEffect, useRef } from "react";
import { io, type Socket } from "socket.io-client";
import { useLiveLocation } from "@/contexts/LocationContext";
import { createClient } from "@/utils/supabase/client";

const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? "http://localhost:3001";

/**
 * When live location is available, connects to the backend and emits each position update.
 * Call this from a component that's mounted when location is needed (e.g. Discover).
 */
export function useLocationSocketSync() {
  const { position, status } = useLiveLocation();
  const socketRef = useRef<Socket | null>(null);
  const userIdRef = useRef<string | null>(null);

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }: { data: { user: { id: string } | null } }) => {
      userIdRef.current = data.user?.id ?? null
    })
  }, [])
  // Keep one socket while watching; disconnect when no longer watching
  useEffect(() => {
    if (status !== "watching") {
      if (socketRef.current) {
        console.log("[Socket] disconnecting (no longer watching)");
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      return;
    }
    console.log("[Socket] connecting to", WS_URL);
    socketRef.current = io(WS_URL);
    socketRef.current.on("connect", () => console.log("[Socket] connected", socketRef.current?.id));
    socketRef.current.on("disconnect", (reason) => console.log("[Socket] disconnected", reason));
    return () => {
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
  }, [status]);

  // Emit each position update on the same socket
  useEffect(() => {
    if (status === "watching" && position && socketRef.current) {
      socketRef.current.emit("location", { lat: position.lat, lng: position.lng });
      console.log("[Socket] emit location", { lat: position.lat.toFixed(4), lng: position.lng.toFixed(4) });
    }
  }, [status, position?.lat, position?.lng]);
}
