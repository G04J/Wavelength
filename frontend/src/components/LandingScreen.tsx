"use client"

import Link from "next/link"
import { motion } from "framer-motion"

const cards = [
  { num: "01", title: "pick your interests", body: "AI generates personalised options just for you. two levels deep. no generic tags." },
  { num: "02", title: "see who's nearby", body: "match cards appear in real time. compatibility score and shared interests. nothing else." },
  { num: "03", title: "mutual tap to connect", body: "tap connect on someone. if they tap back — match fires. if not, nobody ever knows." },
]

function sineWave(
  yOffset: number,
  amplitude: number,
  frequency: number,
  width = 1200
): string {
  const points: string[] = []
  for (let x = 0; x <= width; x += 8) {
    const y = yOffset + amplitude * Math.sin((x / width) * Math.PI * 2 * frequency)
    points.push(`${x},${y}`)
  }
  return `M ${points.join(" L ")}`
}

const waves = [
  { y: 80,  amp: 18, freq: 2.5, opacity: 0.06, delay: "0s" },
  { y: 160, amp: 22, freq: 2,   opacity: 0.05, delay: "0.5s" },
  { y: 240, amp: 14, freq: 3,   opacity: 0.07, delay: "1s" },
  { y: 320, amp: 20, freq: 2.2, opacity: 0.05, delay: "1.5s" },
  { y: 400, amp: 16, freq: 2.8, opacity: 0.06, delay: "0.8s" },
  { y: 480, amp: 24, freq: 1.8, opacity: 0.04, delay: "1.2s" },
  { y: 560, amp: 18, freq: 2.5, opacity: 0.05, delay: "0.3s" },
]

export default function LandingScreen({ onEnter }: { onEnter: () => void }) {
  return (
    <div style={{
      width: "100%",
      minHeight: "100vh",
      background: "#fdf8f6",
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      position: "relative",
      overflow: "hidden",
    }}>
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;1,500&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />

      <style>{`
        @keyframes float1{0%,100%{transform:translateY(0) scale(1)}50%{transform:translateY(-20px) scale(1.05)}}
        @keyframes float2{0%,100%{transform:translateY(0) scale(1)}50%{transform:translateY(16px) scale(0.96)}}
        @keyframes float3{0%,100%{transform:translateY(0) scale(1)}50%{transform:translateY(-12px) scale(1.04)}}
        .blob1{animation:float1 8s ease-in-out infinite}
        .blob2{animation:float2 10s ease-in-out infinite}
        .blob3{animation:float3 7s ease-in-out infinite}
        .blob4{animation:float1 9s ease-in-out infinite reverse}
        @keyframes wavepulse{0%,100%{opacity:0.04}50%{opacity:0.1}}
        .waveline{animation:wavepulse 5s ease-in-out infinite}
      `}</style>

      {/* blobs */}
      <div className="blob1" style={{ position:"absolute", width:320, height:320, borderRadius:"50%", background:"#f9d0d0", filter:"blur(60px)", opacity:0.35, top:-80, right:-60, pointerEvents:"none", zIndex:0 }}/>
      <div className="blob2" style={{ position:"absolute", width:260, height:260, borderRadius:"50%", background:"#fce0c8", filter:"blur(60px)", opacity:0.3, top:"40%", left:-80, pointerEvents:"none", zIndex:0 }}/>
      <div className="blob3" style={{ position:"absolute", width:200, height:200, borderRadius:"50%", background:"#f5c8e0", filter:"blur(60px)", opacity:0.25, bottom:"20%", right:"10%", pointerEvents:"none", zIndex:0 }}/>
      <div className="blob4" style={{ position:"absolute", width:160, height:160, borderRadius:"50%", background:"#fde8c0", filter:"blur(60px)", opacity:0.2, bottom:"10%", left:"30%", pointerEvents:"none", zIndex:0 }}/>

      {/* sine wave lines bg */}
      <svg
        style={{ position:"absolute", inset:0, width:"100%", height:"100%", pointerEvents:"none", zIndex:1 }}
        viewBox="0 0 1200 640"
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
      >
        {waves.map((w, i) => (
          <path
            key={i}
            className="waveline"
            d={sineWave(w.y, w.amp, w.freq)}
            fill="none"
            stroke="#e06060"
            strokeWidth="1"
            opacity={w.opacity}
            style={{ animationDelay: w.delay }}
          />
        ))}
      </svg>

      {/* bottom waves */}
      <div style={{ position:"absolute", bottom:0, left:0, right:0, height:220, zIndex:0, pointerEvents:"none" }}>
        <svg viewBox="0 0 1200 220" preserveAspectRatio="none" style={{ width:"100%", height:"100%" }} xmlns="http://www.w3.org/2000/svg">
          <path d="M0 180 C150 140 300 200 450 165 C600 130 750 190 900 158 C1050 126 1150 170 1200 155 L1200 220 L0 220Z" fill="#f9e8e0" opacity="0.6"/>
          <path d="M0 195 C200 160 350 200 500 178 C650 156 800 195 950 172 C1100 149 1150 185 1200 170 L1200 220 L0 220Z" fill="#f5d8cc" opacity="0.5"/>
          <path d="M0 208 C180 188 320 210 480 198 C640 186 780 208 940 196 C1080 184 1150 202 1200 194 L1200 220 L0 220Z" fill="#f0c8b8" opacity="0.4"/>
        </svg>
      </div>

      {/* nav */}
      <nav style={{
        display:"flex", alignItems:"center", justifyContent:"space-between",
        padding:"1.2rem 2.5rem", borderBottom:"1px solid rgba(220,180,180,0.2)",
        position:"relative", zIndex:3,
        background:"rgba(253,248,246,0.85)", backdropFilter:"blur(8px)",
      }}>
        <Link href="/" style={{ display:"flex", alignItems:"center", gap:8, textDecoration:"none" }}>
          <svg width="20" height="13" viewBox="0 0 20 13" fill="none">
            <path d="M1 6.5 C3 2 5.5 2 7.5 6.5 C9.5 11 12 11 14 6.5 C16 2 18.5 2 19 6.5" stroke="#e06060" strokeWidth="2" strokeLinecap="round" fill="none"/>
          </svg>
          <span style={{ fontSize:"0.95rem", fontWeight:700, color:"#c05858", letterSpacing:"-0.01em" }}>wave~length</span>
        </Link>
        <div style={{ display:"flex", alignItems:"center", gap:"1.5rem" }}>
          <div style={{ display:"flex", gap:"1.5rem", fontSize:"0.78rem", color:"#b08080", fontWeight:500 }}>
            <Link href="/discover" style={{ color:"inherit", textDecoration:"none", cursor:"pointer" }}>find your people nearby</Link>
            <Link href="/profile" style={{ color:"inherit", textDecoration:"none", cursor:"pointer" }}>my profile</Link>
          </div>
          <div style={{ width:32, height:32, borderRadius:"50%", background:"#f0c8b8", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"0.75rem", fontWeight:700, color:"#c05858" }}>A</div>
        </div>
      </nav>

      {/* hero */}
      <div style={{ display:"flex", flexDirection:"column", alignItems:"center", padding:"4rem 2rem 2.5rem", textAlign:"center", position:"relative", zIndex:2 }}>
        <motion.div
          initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.1, duration:0.5 }}
          style={{ display:"flex", alignItems:"center", gap:6, marginBottom:"1rem" }}
        >
          <div style={{ width:6, height:6, borderRadius:"50%", background:"#e08080" }}/>
          <span style={{ fontSize:"0.68rem", letterSpacing:"0.15em", textTransform:"uppercase", color:"#e08080", fontWeight:600 }}>
            mutual vibes only
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.2, duration:0.6 }}
          style={{ fontFamily:"'Playfair Display', serif", fontSize:"clamp(2.4rem, 5vw, 3.8rem)", fontWeight:700, color:"#3a1a1a", lineHeight:1.1, marginBottom:"1rem", maxWidth:580 }}
        >
          your people are closer<br />
          than <em style={{ fontStyle:"italic", color:"#e06060" }}>you think.</em>
        </motion.h1>

        <motion.p
          initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.35, duration:0.5 }}
          style={{ fontSize:"0.88rem", color:"#b08080", lineHeight:1.8, maxWidth:260, marginBottom:"2rem" }}
        >
          discover who's nearby.
        </motion.p>

        <motion.button
          initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.45, duration:0.4 }}
          whileHover={{ scale:1.04 }} whileTap={{ scale:0.97 }}
          onClick={onEnter}
          style={{ background:"#e06060", color:"#ffffff", border:"none", borderRadius:"999px", padding:"12px 32px", fontSize:"0.85rem", fontWeight:600, cursor:"pointer", fontFamily:"'Plus Jakarta Sans', sans-serif", boxShadow:"0 4px 24px rgba(224,96,96,0.25)" }}
        >
          find my wavelength →
        </motion.button>
      </div>

      {/* how it works */}
      <div style={{ padding:"0 2.5rem 3rem", position:"relative", zIndex:2 }}>
        <motion.p
          initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.55 }}
          style={{ fontSize:"0.68rem", letterSpacing:"0.15em", textTransform:"uppercase", color:"#e08080", fontWeight:600, marginBottom:"1.2rem" }}
        >
          how it works
        </motion.p>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(200px, 1fr))", gap:16 }}>
          {cards.map((card, i) => (
            <motion.div
              key={card.num}
              initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.6 + i * 0.1, duration:0.4 }}
              style={{ background:"rgba(255,255,255,0.85)", backdropFilter:"blur(12px)", borderRadius:16, padding:"1.5rem", border:"1px solid rgba(220,180,180,0.25)" }}
            >
              <p style={{ fontSize:"0.65rem", letterSpacing:"0.15em", textTransform:"uppercase", color:"#e08080", fontWeight:600, marginBottom:"0.5rem" }}>{card.num}</p>
              <p style={{ fontSize:"0.92rem", fontWeight:700, color:"#3a1a1a", lineHeight:1.25, marginBottom:"0.6rem" }}>{card.title}</p>
              <p style={{ fontSize:"0.78rem", color:"#b08080", lineHeight:1.7 }}>{card.body}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}
