"use client";

import { useEffect, useRef } from "react";
import { io, type Socket } from "socket.io-client";
import { useLiveLocation } from "@/contexts/LocationContext";
import { createClient } from "@/utils/supabase/client";

const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? "http://localhost:3001";

export function useLocationSocketSync() {
  const { position, status } = useLiveLocation();
  console.log("[Socket] status:", status, "position:", position)
  const socketRef = useRef<Socket | null>(null);

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
    socketRef.current.on("connect", () =>
      console.log("[Socket] connected", socketRef.current?.id)
    );
    socketRef.current.on("disconnect", (reason) =>
      console.log("[Socket] disconnected", reason)
    );
    return () => {
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
  }, [status]);

  // Emit location only once userId is confirmed — fixes the race condition
  // where userId was null when the first position fired
  useEffect(() => {
    if (status !== "watching" || !position || !socketRef.current) return;

    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      const userId = data.user?.id;
      if (!userId) {
        console.log("[Socket] no userId yet, skipping emit");
        return;
      }
      console.log("[Socket] emitting location", userId, position.lat, position.lng);
      socketRef.current?.emit("location", {
        lat: Number(position.lat),
        lng: Number(position.lng),
        userId,
      });
    });
  }, [status, position?.lat, position?.lng]);

  // auto-restore user to ES on mount
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async (res) => {
      const userId = res.data.user?.id
      if (!userId) return

      const { data: interests } = await supabase
        .from("user_interests")
        .select("interest, category")
        .eq("user_id", userId)

      if (!interests?.length) return

      const sectionData = {
        music: interests.filter(r => r.category === "music").map(r => r.interest),
        tv: interests.filter(r => r.category === "tv").map(r => r.interest),
        games: interests.filter(r => r.category === "games").map(r => r.interest),
        interests: interests.filter(r => r.category === "interests").map(r => r.interest),
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("name")
        .eq("id", userId)
        .maybeSingle()

      await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:3001"}/api/profile`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, sectionData, name: profile?.name ?? "" })
      })
    })
  }, [])
}