"use client"

import { useEffect } from "react"
import { useLocationSocketSync } from "@/hooks/useLocationSocketSync"
import { useLiveLocation } from "@/contexts/LocationContext"
import MapScreen from "../../components/MapsScreen"

function MapPageInner() {
  useLocationSocketSync()
  const { enableWatching } = useLiveLocation()

  useEffect(() => {
    enableWatching()
  }, [enableWatching])

  return <MapScreen />
}

export default function MapPage() {
  return <MapPageInner />
}