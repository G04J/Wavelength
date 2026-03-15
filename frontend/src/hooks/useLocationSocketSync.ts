"use client";

import { useEffect, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";
import { useLiveLocation } from "@/contexts/LocationContext";
import { createClient } from "@/utils/supabase/client";

const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? "http://localhost:3001";

export function useLocationSocketSync() {
  const { position, status } = useLiveLocation();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [nearbyUsersRaw, setNearbyUsersRaw] = useState<any[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const userIdRef = useRef<string | null>(null);
  userIdRef.current = userId;

  // Subscribe to Supabase auth so we get userId when logged in (and updates across tabs)
  useEffect(() => {
    const supabase = createClient();
    const setUser = () => {
      supabase.auth.getUser().then(({ data }) => {
        const id = data.user?.id ?? null;
        setUserId(id);
      });
    };
    setUser();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      setUser();
    });
    return () => subscription.unsubscribe();
  }, []);

  // Single socket — create only when status is "watching"; do NOT depend on userId so we don't recreate socket
  useEffect(() => {
    if (status !== "watching") {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      return;
    }

    const s = io(WS_URL, { transports: ["websocket"] });
    setSocket(s);

    s.on("connect", () => {
      console.log("[Socket] connected", s.id);
      const uid = userIdRef.current;
      if (uid) {
        s.emit("register", { userId: uid });
        console.log("[Socket] registered", uid);
      }
    });

    s.on("disconnect", (reason) =>
      console.log("[Socket] disconnected", reason)
    );

    s.on("nearby_users", (payload: any[]) => {
      setNearbyUsersRaw(payload ?? []);
    });

    return () => {
      s.disconnect();
      setSocket(null);
    };
  }, [status]);

  // Re-register whenever userId becomes available (e.g. after Supabase auth resolves)
  useEffect(() => {
    if (!userId || !socket?.connected) return;
    socket.emit("register", { userId });
    console.log("[Socket] register (userId ready)", userId);
  }, [userId, socket]);

  // Emit location when position changes (same userId so backend and chat routing match)
  useEffect(() => {
    if (status !== "watching" || !position || !socket || !userId) return;
    socket.emit("location", {
      lat: Number(position.lat),
      lng: Number(position.lng),
      userId,
    });
  }, [status, position?.lat, position?.lng, userId, socket]);

  return {
    socket,
    nearbyUsersRaw,
    userId,
  };
}