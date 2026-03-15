"use client";

import { useEffect, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";
import { useLiveLocation } from "@/contexts/LocationContext";
import { createClient } from "@/utils/supabase/client";

const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? "http://localhost:3001";

export function useLocationSocketSync() {
  const { position, status } = useLiveLocation();
  const socketRef = useRef<Socket | null>(null);
  const [nearbyUsersRaw, setNearbyUsersRaw] = useState<any[]>([]);
  const [userId, setUserId] = useState<string | null>(null);

  // Resolve userId once from Supabase
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data.user?.id) setUserId(data.user.id);
    });
  }, []);

  // Single socket — connects when watching, disconnects when not
  useEffect(() => {
    if (status !== "watching") {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      return;
    }

    const s = io(WS_URL, { transports: ["websocket"] });
    socketRef.current = s;

    s.on("connect", () => {
      console.log("[Socket] connected", s.id);
      if (userId) s.emit("register", { userId });
    });

    s.on("disconnect", (reason) =>
      console.log("[Socket] disconnected", reason)
    );

    s.on("nearby_users", (payload: any[]) => {
      console.log("[Socket] nearby_users received:", payload?.length, "users");
      setNearbyUsersRaw(payload ?? []);
    });

    return () => {
      s.disconnect();
      socketRef.current = null;
    };
  }, [status, userId]);

  // Re-register if userId arrives after socket connected
  useEffect(() => {
    if (userId && socketRef.current?.connected) {
      socketRef.current.emit("register", { userId });
    }
  }, [userId]);

  // Emit location when position changes
  useEffect(() => {
    if (status !== "watching" || !position || !socketRef.current || !userId) return;
    socketRef.current.emit("location", {
      lat: Number(position.lat),
      lng: Number(position.lng),
      userId,
    });
  }, [status, position?.lat, position?.lng, userId]);

  return {
    socket: socketRef.current,
    nearbyUsersRaw,
    userId,
  };
}