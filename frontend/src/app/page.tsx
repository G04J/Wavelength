"use client"

// import { useRouter } from "next/navigation"
// import LandingScreen from "@/components/LandingScreen"
import Link from "next/link";


// export default function HomePage() {
//   const router = useRouter()

//   return (
//     <LandingScreen
//       onEnter={() => router.push("/profile")}
//     />
//   )
// }

import { useRouter } from "next/navigation"
import LandingScreen from "@/components/LandingScreen"


export default function Home() {
  const router = useRouter()
  return <LandingScreen onEnter={() => router.push("/signin")} />
}

