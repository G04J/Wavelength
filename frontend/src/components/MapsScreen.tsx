"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { useLiveLocation } from "@/contexts/LocationContext";
import { useLocationSocketSync } from "@/hooks/useLocationSocketSync";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface NearbyUser {
  uid: string;
  similarity: number;
  lat: number;
  lng: number;
  sharedInterests: string[];
  name?: string;
}

type PublicProfile = {
  name: string | null;
  show_social_to_nearby: boolean;
  facebook_url: string | null;
  instagram_handle: string | null;
};

// Fallback when geolocation is not yet available (Leaflet requires valid numbers)
const FALLBACK_CENTER = { lat: -33.8688, lng: 151.2093 };

// ─── Helpers ──────────────────────────────────────────────────────────────────

function similarityToColor(score: number): { fill: string; glow: string; text: string } {
  if (score >= 0.85) return { fill: "#C0392B", glow: "rgba(192,57,43,0.35)", text: "#fff" };
  if (score >= 0.70) return { fill: "#E05B4B", glow: "rgba(224,91,75,0.30)", text: "#fff" };
  if (score >= 0.55) return { fill: "#EF8C7E", glow: "rgba(239,140,126,0.25)", text: "#fff" };
  if (score >= 0.40) return { fill: "#F5B8B0", glow: "rgba(245,184,176,0.20)", text: "#9a3a30" };
  return { fill: "#FAD7D3", glow: "rgba(250,215,211,0.15)", text: "#b05048" };
}

const HEART_SIZE_BASE = 56;
const HEART_SIZE_MAX = 80;

// ─── Heart marker builder (no chat badges) ────────────────────────────────────

function buildCuteHeart(
  _fill: string, _glow: string, _textColor: string,
  pct: number, index: number
): string {
  const delay = (index * 0.4) % 2.8;
  const score01 = pct / 100;
  const size = Math.round(HEART_SIZE_BASE + score01 * (HEART_SIZE_MAX - HEART_SIZE_BASE));
  const saturate = (0.1 + score01 * 1.25).toFixed(2);
  const brightness = (0.82 + score01 * 0.32).toFixed(2);
  return `
    <div class="wl-heart" style="position:relative;width:${size}px;height:${size}px;cursor:pointer;animation:wl-float ${2.5 + (index % 3) * 0.3}s ease-in-out ${delay}s infinite;">
      <img src="/heart-3d.png" width="${size}" height="${size}" draggable="false" style="display:block;width:${size}px;height:${size}px;object-fit:contain;filter:saturate(${saturate}) brightness(${brightness}) drop-shadow(0 3px 8px rgba(120,20,20,0.2));"/>
      <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;padding-bottom:2px;font-family:'DM Sans',system-ui,sans-serif;font-size:${Math.round(size * 0.22)}px;font-weight:700;color:white;text-shadow:0 1px 3px rgba(0,0,0,0.4);pointer-events:none;">${pct}%</div>
    </div>`;
}

// ─── Inject styles ───────────────────────────────────────────────────────────

let stylesInjected = false;
function injectStyles() {
  if (stylesInjected || typeof document === "undefined") return;
  stylesInjected = true;
  const s = document.createElement("style");
  s.textContent = `
    @keyframes wl-float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-5px); } }
    .wl-heart img { transition: transform 0.18s cubic-bezier(0.34,1.56,0.64,1); }
    .wl-heart:hover img { transform: scale(1.08); }
    .leaflet-marker-icon.leaflet-wavelength-heart { width: ${HEART_SIZE_MAX}px !important; height: ${HEART_SIZE_MAX}px !important; margin-left: -${HEART_SIZE_MAX / 2}px !important; margin-top: -${HEART_SIZE_MAX / 2}px !important; }
    .leaflet-marker-icon.leaflet-wavelength-heart.wl-heart-selected .wl-heart { box-shadow: 0 0 0 6px rgba(192,57,43,0.14), 0 10px 26px rgba(0,0,0,0.22); border-radius: 50%; }
    .leaflet-marker-icon.leaflet-wavelength-heart.wl-heart-selected .wl-heart img { transform: scale(1.12); }
  `;
  document.head.appendChild(s);
}

// ─── Compute thread points ───────────────────────────────────────────────────

function computeThreadPoints(fromLat: number, fromLng: number, toLat: number, toLng: number, index: number): [number, number][] {
  const dLat = toLat - fromLat, dLng = toLng - fromLng;
  const laterals = [0.30, -0.22, 0.42, -0.38, 0.18, -0.48, 0.35];
  const sags = [0.35, 0.28, 0.40, 0.32, 0.25, 0.38, 0.30];
  const lateral = laterals[index % laterals.length], sag = sags[index % sags.length];
  const perpLat = -dLng, perpLng = dLat;
  const cp1Lat = fromLat + dLat * 0.30 + perpLat * lateral + Math.abs(dLat + dLng) * sag * 0.5;
  const cp1Lng = fromLng + dLng * 0.30 + perpLng * lateral;
  const cp2Lat = fromLat + dLat * 0.70 + perpLat * lateral * 0.4 + Math.abs(dLat + dLng) * sag * 0.25;
  const cp2Lng = fromLng + dLng * 0.70 + perpLng * lateral * 0.4;
  const pts: [number, number][] = [];
  for (let i = 0; i <= 40; i++) {
    const t = i / 40, u = 1 - t;
    pts.push([u*u*u*fromLat+3*u*u*t*cp1Lat+3*u*t*t*cp2Lat+t*t*t*toLat, u*u*u*fromLng+3*u*u*t*cp1Lng+3*u*t*t*cp2Lng+t*t*t*toLng]);
  }
  return pts;
}

// ─── Profile Popup (compatibility + shared interests + social links) ──────────

function ProfilePopup({ user, publicProfile, onClose }: {
  user: NearbyUser;
  publicProfile: PublicProfile | null;
  onClose: () => void;
}) {
  const pct = Math.round(user.similarity * 100);
  const { fill } = similarityToColor(user.similarity);
  const name = publicProfile?.name ?? user.name ?? "Someone nearby";
  const hasSocial = publicProfile?.show_social_to_nearby && (publicProfile.facebook_url || publicProfile.instagram_handle);
  const facebookUrl = publicProfile?.facebook_url?.trim();
  const instagramHandle = publicProfile?.instagram_handle?.trim();
  const facebookHref = facebookUrl
    ? (facebookUrl.startsWith("http") ? facebookUrl : `https://facebook.com/${facebookUrl}`)
    : null;
  const instagramHref = instagramHandle ? `https://instagram.com/${instagramHandle.replace(/^@/, "")}` : null;

  return (
    <div style={{ position:"absolute",bottom:24,left:"50%",transform:"translateX(-50%)",width:300,background:"white",borderRadius:20,boxShadow:"0 8px 40px rgba(0,0,0,0.18)",padding:"20px 20px 16px",zIndex:1000,fontFamily:"'DM Sans',system-ui,sans-serif" }}>
      <button onClick={onClose} style={{ position:"absolute",top:12,right:14,background:"none",border:"none",fontSize:18,color:"#aaa",cursor:"pointer",lineHeight:1 }}>×</button>
      <div style={{ display:"inline-flex",alignItems:"center",gap:5,background:"#FFF5F4",border:"1px solid #FFD5CF",borderRadius:99,padding:"3px 10px",fontSize:11,color:"#C0392B",fontWeight:600,marginBottom:12,letterSpacing:"0.03em" }}>
        <span style={{ fontSize:10 }}>✦</span>
        MUTUAL VIBES ONLY
      </div>
      <div style={{ display:"flex",alignItems:"center",gap:14,marginBottom:14 }}>
        <div style={{ position:"relative",width:56,height:56,flexShrink:0 }}>
          <svg width={56} height={56} viewBox="0 0 56 56"><circle cx={28} cy={28} r={22} fill="none" stroke="#FDE8E6" strokeWidth={5}/><circle cx={28} cy={28} r={22} fill="none" stroke={fill} strokeWidth={5} strokeDasharray={`${2*Math.PI*22}`} strokeDashoffset={`${2*Math.PI*22*(1-user.similarity)}`} strokeLinecap="round" transform="rotate(-90 28 28)"/></svg>
          <span style={{ position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:700,color:fill }}>{pct}%</span>
        </div>
        <div>
          <div style={{ fontSize:15,fontWeight:600,color:"#1a1a1a",marginBottom:2 }}>{pct>=80?"Strong match":pct>=60?"Good match":"Possible match"}</div>
          <div style={{ fontSize:12,color:"#888" }}>{name} · {pct}% compatible</div>
        </div>
      </div>
      <div style={{ marginBottom:14 }}>
        <div style={{ fontSize:11,color:"#aaa",fontWeight:600,letterSpacing:"0.05em",marginBottom:6 }}>BOTH INTO</div>
        <div style={{ display:"flex",flexWrap:"wrap",gap:5 }}>{user.sharedInterests.length ? user.sharedInterests.map(tag=>(<span key={tag} style={{ background:"#FFF5F4",color:"#C0392B",border:"1px solid #FFD5CF",borderRadius:99,padding:"3px 10px",fontSize:12,fontWeight:500 }}>{tag}</span>)) : <span style={{ fontSize:12,color:"#999" }}>—</span>}</div>
      </div>
      {hasSocial && (facebookHref || instagramHref) && (
        <div style={{ marginTop:14,paddingTop:14,borderTop:"1px solid rgba(0,0,0,0.06)" }}>
          <div style={{ fontSize:11,color:"#aaa",fontWeight:600,letterSpacing:"0.05em",marginBottom:8 }}>CONNECT</div>
          <div style={{ display:"flex",gap:12,alignItems:"center" }}>
            {facebookHref && (
              <a href={facebookHref} target="_blank" rel="noopener noreferrer" style={{ display:"flex",alignItems:"center",gap:6,color:"#1877F2",fontSize:13,fontWeight:500,textDecoration:"none" }}>
                <svg width={20} height={20} viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                Facebook
              </a>
            )}
            {instagramHref && (
              <a href={instagramHref} target="_blank" rel="noopener noreferrer" style={{ display:"flex",alignItems:"center",gap:6,color:"#E4405F",fontSize:13,fontWeight:500,textDecoration:"none" }}>
                <svg width={20} height={20} viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                Instagram
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function MapScreen() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const [leafletLoaded, setLeafletLoaded] = useState(false);
  const [selectedUser, setSelectedUser] = useState<NearbyUser | null>(null);
  const [publicProfile, setPublicProfile] = useState<PublicProfile | null>(null);

  const { nearbyUsersRaw } = useLocationSocketSync();
  const { position } = useLiveLocation();
  const lat = position && typeof position.lat === "number" && !Number.isNaN(position.lat) ? position.lat : FALLBACK_CENTER.lat;
  const lng = position && typeof position.lng === "number" && !Number.isNaN(position.lng) ? position.lng : FALLBACK_CENTER.lng;
  const center = { lat, lng };

  const displayUsers: NearbyUser[] = (nearbyUsersRaw ?? []).map((hit: any) => ({
    uid: hit.userId,
    lat: hit.location?.lat ?? 0,
    lng: hit.location?.lon ?? 0,
    similarity: Math.min(1, Math.max(0, typeof hit.similarity === "number" ? hit.similarity : 0)),
    sharedInterests: Array.isArray(hit.sharedInterests) ? hit.sharedInterests : [],
    name: hit.name,
  }));

  // Fetch public profile (social links) when a heart is selected
  useEffect(() => {
    if (!selectedUser?.uid) {
      setPublicProfile(null);
      return;
    }
    let cancelled = false;
    fetch(`/api/profile/public/${encodeURIComponent(selectedUser.uid)}`)
      .then((res) => res.json())
      .then((data: PublicProfile) => {
        if (!cancelled) setPublicProfile(data);
      })
      .catch(() => {
        if (!cancelled) setPublicProfile(null);
      });
    return () => { cancelled = true; };
  }, [selectedUser?.uid]);

  // ── Load Leaflet ──
  useEffect(() => {
    if (typeof window === "undefined") return;
    injectStyles();
    if ((window as any).L) { setLeafletLoaded(true); return; }
    const link = document.createElement("link"); link.rel = "stylesheet"; link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"; document.head.appendChild(link);
    const script = document.createElement("script"); script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"; script.onload = () => setLeafletLoaded(true); document.head.appendChild(script);
  }, []);

  // ── Init map ──
  useEffect(() => {
    if (!leafletLoaded || !mapRef.current || mapInstanceRef.current) return;
    const L = (window as any).L;
    const map = L.map(mapRef.current, { center: [center.lat, center.lng], zoom: 15, zoomControl: false, attributionControl: false });
    L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}{r}.png", { maxZoom: 19 }).addTo(map);
    L.control.zoom({ position: "bottomright" }).addTo(map);
    mapInstanceRef.current = map;
    map.on("click", () => { setSelectedUser(null); document.querySelectorAll(".leaflet-wavelength-heart.wl-heart-selected").forEach(el => el.classList.remove("wl-heart-selected")); });
  }, [leafletLoaded]);

  useEffect(() => { if (position && mapInstanceRef.current) mapInstanceRef.current.setView([position.lat, position.lng], mapInstanceRef.current.getZoom(), { animate: true }); }, [position?.lat, position?.lng]);
  useEffect(() => { if (!selectedUser) document.querySelectorAll(".leaflet-wavelength-heart.wl-heart-selected").forEach(el => el.classList.remove("wl-heart-selected")); }, [selectedUser]);

  // ── Draw markers ──
  const redrawMarkers = useCallback(() => {
    const L = (window as any).L; const map = mapInstanceRef.current;
    if (!map || !L) return;
    map.eachLayer((layer: any) => { if (layer._wavelength) map.removeLayer(layer); });

    const youIcon = L.divIcon({ className: "", html: `<div style="width:18px;height:18px;background:#1abc9c;border:3px solid white;border-radius:50%;box-shadow:0 0 0 5px rgba(26,188,156,0.2),0 0 12px rgba(26,188,156,0.3);"></div>`, iconSize: [18,18], iconAnchor: [9,9] });
    const ym = L.marker([center.lat, center.lng], { icon: youIcon }); ym._wavelength = true; ym.addTo(map);
    const ring = L.circle([center.lat, center.lng], { radius: 2000, color: "rgba(192,57,43,0.12)", weight: 1.5, dashArray: "6 4", fillColor: "rgba(192,57,43,0.02)", fillOpacity: 1, interactive: false }); ring._wavelength = true; ring.addTo(map);

    displayUsers.forEach((user, i) => {
      const { fill, glow, text } = similarityToColor(user.similarity);
      const pct = Math.round(user.similarity * 100);
      const pts = computeThreadPoints(center.lat, center.lng, user.lat, user.lng, i);
      const thread = L.polyline(pts, { color: "#C0392B", weight: 1.5, opacity: 0.35, smoothFactor: 1.5, lineCap: "round", lineJoin: "round", interactive: false }); thread._wavelength = true; thread.addTo(map);

      const heartIcon = L.divIcon({ className: "leaflet-wavelength-heart", html: buildCuteHeart(fill, glow, text, pct, i), iconSize: [HEART_SIZE_MAX, HEART_SIZE_MAX], iconAnchor: [HEART_SIZE_MAX/2, HEART_SIZE_MAX/2] });
      const marker = L.marker([user.lat, user.lng], { icon: heartIcon }); marker._wavelength = true;
      marker.on("click", () => {
        document.querySelectorAll(".leaflet-wavelength-heart.wl-heart-selected").forEach(el => el.classList.remove("wl-heart-selected"));
        ((marker as any)._icon as HTMLElement)?.classList.add("wl-heart-selected");
        map.setView([user.lat, user.lng], Math.max(map.getZoom(), 16), { animate: true });
        setSelectedUser(user);
      });
      marker.addTo(map);
    });
  }, [center.lat, center.lng, displayUsers]);

  useEffect(() => { if (mapInstanceRef.current && leafletLoaded) redrawMarkers(); }, [leafletLoaded, redrawMarkers]);

  return (
    <div style={{ position:"relative",width:"100%",height:"100vh",fontFamily:"'DM Sans',system-ui,sans-serif",overflow:"hidden" }}>
      <div ref={mapRef} style={{ width:"100%",height:"100%" }}/>

      {/* Nav */}
      <div style={{ position:"absolute",top:0,left:0,right:0,height:64,background:"rgba(255,255,255,0.92)",backdropFilter:"blur(12px)",borderBottom:"0.5px solid rgba(0,0,0,0.07)",display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 20px",zIndex:800 }}>
        <Link href="/" style={{ display:"flex",alignItems:"center",gap:8,textDecoration:"none" }}>
          <svg width={20} height={14} viewBox="0 0 20 14"><polyline points="0,7 3,2 6,12 9,4 12,10 15,7 18,7" fill="none" stroke="#C0392B" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"/></svg>
          <span style={{ fontSize:17,fontWeight:600,color:"#1a1a1a",letterSpacing:"-0.3px" }}>wavelength</span>
        </Link>
        <div style={{ display:"flex",gap:8,alignItems:"center" }}>
          <button style={{ background:"white",border:"0.5px solid rgba(0,0,0,0.12)",borderRadius:20,padding:"7px 16px",fontSize:13,fontWeight:500,color:"#333",cursor:"pointer" }}>Find your people nearby</button>
          <Link href="/profile" style={{ background:"none",border:"none",fontSize:13,fontWeight:500,color:"#666",cursor:"pointer",padding:"7px 8px",textDecoration:"none" }}>My Profile</Link>
        </div>
        <div style={{ width:34,height:34,borderRadius:"50%",background:"#F5B8B0",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:700,color:"#C0392B" }}>A</div>
      </div>

      {/* Stats */}
      <div style={{ position:"absolute",bottom:24,left:20,background:"rgba(255,255,255,0.94)",backdropFilter:"blur(10px)",borderRadius:16,padding:"14px 18px",boxShadow:"0 2px 20px rgba(0,0,0,0.10)",zIndex:800,minWidth:180 }}>
        <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:8 }}><div style={{ width:10,height:10,borderRadius:"50%",background:"#1abc9c" }}/><span style={{ fontSize:13,color:"#444",fontWeight:500 }}>You are here</span></div>
        <div style={{ fontSize:12,color:"#888",marginBottom:6 }}>People nearby: <strong style={{ color:"#333" }}>{displayUsers.length}</strong></div>
        <div style={{ fontSize:12,color:"#888",marginBottom:10 }}>Matching radius: <strong style={{ color:"#333" }}>2 km</strong></div>
        <div style={{ fontSize:11,color:"#aaa",fontWeight:600,letterSpacing:"0.04em",marginBottom:5 }}>COMPATIBILITY</div>
        <div style={{ height:4,borderRadius:2,background:"linear-gradient(to right, #FAD7D3, #C0392B)",marginBottom:4 }}/>
        <div style={{ display:"flex",justifyContent:"space-between",fontSize:10,color:"#aaa" }}><span>40%</span><span>90%</span></div>
      </div>

      {/* Info card */}
      <div style={{ position:"absolute",top:80,right:20,background:"rgba(255,255,255,0.96)",backdropFilter:"blur(10px)",borderRadius:20,padding:"18px 20px",boxShadow:"0 2px 20px rgba(0,0,0,0.10)",zIndex:800,maxWidth:240 }}>
        <div style={{ display:"flex",alignItems:"center",gap:6,marginBottom:10 }}><span style={{ color:"#C0392B",fontSize:12 }}>✦</span><span style={{ fontSize:12,color:"#C0392B",fontWeight:600 }}>find your freakquency</span></div>
        <p style={{ fontSize:15,lineHeight:1.5,color:"#1a1a1a",fontWeight:500,marginBottom:6 }}>The person next to you might be your <span style={{ color:"#C0392B",fontWeight:700 }}>people.</span></p>
        <p style={{ fontSize:13,color:"#888",marginBottom:14,lineHeight:1.5 }}>You just don&apos;t know it yet.</p>
        <Link href="/how-it-works" style={{ background:"none",border:"none",fontSize:13,color:"#C0392B",fontWeight:600,cursor:"pointer",padding:0,textDecoration:"none" }}>How it works →</Link>
      </div>

      {/* Popup: compatibility + shared interests + social links */}
      {selectedUser && (
        <ProfilePopup user={selectedUser} publicProfile={publicProfile} onClose={() => setSelectedUser(null)} />
      )}
    </div>
  );
}
