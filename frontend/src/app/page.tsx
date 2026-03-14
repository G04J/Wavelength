"use client"

import { useRouter } from "next/navigation"
import LandingScreen from "@/components/LandingScreen"

export default function HomePage() {
  const router = useRouter()

  return (
    <LandingScreen
      onEnter={() => router.push("/profile")}
    />
  )
}
