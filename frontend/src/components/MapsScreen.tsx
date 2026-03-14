"use client";

import { useEffect, useRef, useState, useCallback } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface NearbyUser {
  uid: string;
  similarity: number;      // 0–1 from backend kNN
  lat: number;
  lng: number;
  sharedInterests: string[];
  name?: string;
}

// ─── HARDCODED CENTER (Sydney CBD) ───────────────────────────────────────────
// TODO: replace with real geolocation when backend is ready
const HARDCODED_CENTER = { lat: -33.8688, lng: 151.2093 };

// ─── HARDCODED NEARBY USERS ───────────────────────────────────────────────────
// TODO: replace with real kNN results from backend
const HARDCODED_USERS: NearbyUser[] = [
  {
    uid: "user-1",
    similarity: 0.88,
    lat: -33.8608, lng: 151.1981,
    sharedInterests: ["Radiohead", "Elden Ring", "Succession"],
  },
  {
    uid: "user-2",
    similarity: 0.72,
    lat: -33.8748, lng: 151.1949,
    sharedInterests: ["Bon Iver", "Hollow Knight", "The Bear"],
  },
  {
    uid: "user-3",
    similarity: 0.81,
    lat: -33.8648, lng: 151.2253,
    sharedInterests: ["Frank Ocean", "Disco Elysium", "Fleabag"],
  },
  {
    uid: "user-4",
    similarity: 0.54,
    lat: -33.8788, lng: 151.2173,
    sharedInterests: ["Tame Impala", "Stardew Valley", "Atlanta"],
  },
  {
    uid: "user-5",
    similarity: 0.69,
    lat: -33.8558, lng: 151.2143,
    sharedInterests: ["Mitski", "Hades", "Severance"],
  },
  {
    uid: "user-6",
    similarity: 0.46,
    lat: -33.8738, lng: 151.2063,
    sharedInterests: ["James Blake", "Celeste", "Skins"],
  },
  {
    uid: "user-7",
    similarity: 0.63,
    lat: -33.8778, lng: 151.2273,
    sharedInterests: ["FKA Twigs", "Outer Wilds", "Twin Peaks"],
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function similarityToColor(score: number): { fill: string; glow: string; text: string } {
  if (score >= 0.85) return { fill: "#C0392B", glow: "rgba(192,57,43,0.35)",   text: "#fff" };
  if (score >= 0.70) return { fill: "#E05B4B", glow: "rgba(224,91,75,0.30)",   text: "#fff" };
  if (score >= 0.55) return { fill: "#EF8C7E", glow: "rgba(239,140,126,0.25)", text: "#7a1a10" };
  if (score >= 0.40) return { fill: "#F5B8B0", glow: "rgba(245,184,176,0.20)", text: "#9a3a30" };
  return                     { fill: "#FAD7D3", glow: "rgba(250,215,211,0.15)", text: "#b05048" };
}

const HEART_PATH = "M0,-14 C0,-14 -3,-20 -10,-20 C-18,-20 -22,-12 -22,-6 C-22,4 -14,12 0,22 C14,12 22,4 22,-6 C22,-12 18,-20 10,-20 C3,-20 0,-14 0,-14 Z";

// ─── Profile Popup ────────────────────────────────────────────────────────────

function ProfilePopup({ user, onClose, onChat }: {
  user: NearbyUser;
  onClose: () => void;
  onChat: (uid: string) => void;
}) {
  const pct = Math.round(user.similarity * 100);
  const { fill } = similarityToColor(user.similarity);

  return (
    <div style={{
      position: "absolute", bottom: 24, left: "50%",
      transform: "translateX(-50%)", width: 300,
      background: "white", borderRadius: 20,
      boxShadow: "0 8px 40px rgba(0,0,0,0.18)",
      padding: "20px 20px 16px", zIndex: 1000,
      fontFamily: "'DM Sans', system-ui, sans-serif",
    }}>
      <button onClick={onClose} style={{
        position: "absolute", top: 12, right: 14,
        background: "none", border: "none", fontSize: 18,
        color: "#aaa", cursor: "pointer", lineHeight: 1,
      }}>×</button>

      <div style={{
        display: "inline-flex", alignItems: "center", gap: 5,
        background: "#FFF5F4", border: "1px solid #FFD5CF",
        borderRadius: 99, padding: "3px 10px",
        fontSize: 11, color: "#C0392B", fontWeight: 600,
        marginBottom: 12, letterSpacing: "0.03em",
      }}>
        <span style={{ fontSize: 10 }}>✦</span> ANONYMOUS & MUTUAL
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14 }}>
        <div style={{ position: "relative", width: 56, height: 56, flexShrink: 0 }}>
          <svg width={56} height={56} viewBox="0 0 56 56">
            <circle cx={28} cy={28} r={22} fill="none" stroke="#FDE8E6" strokeWidth={5} />
            <circle cx={28} cy={28} r={22} fill="none" stroke={fill} strokeWidth={5}
              strokeDasharray={`${2 * Math.PI * 22}`}
              strokeDashoffset={`${2 * Math.PI * 22 * (1 - user.similarity)}`}
              strokeLinecap="round" transform="rotate(-90 28 28)"
            />
          </svg>
          <span style={{
            position: "absolute", inset: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 13, fontWeight: 700, color: fill,
          }}>{pct}%</span>
        </div>
        <div>
          <div style={{ fontSize: 15, fontWeight: 600, color: "#1a1a1a", marginBottom: 2 }}>
            {pct >= 80 ? "Strong match" : pct >= 60 ? "Good match" : "Possible match"}
          </div>
          <div style={{ fontSize: 12, color: "#888" }}>
            {user.name ?? "Anonymous nearby"}
          </div>
        </div>
      </div>

      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 11, color: "#aaa", fontWeight: 600, letterSpacing: "0.05em", marginBottom: 6 }}>
          BOTH INTO
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
          {user.sharedInterests.map(tag => (
            <span key={tag} style={{
              background: "#FFF5F4", color: "#C0392B",
              border: "1px solid #FFD5CF", borderRadius: 99,
              padding: "3px 10px", fontSize: 12, fontWeight: 500,
            }}>{tag}</span>
          ))}
        </div>
      </div>

      <button
        onClick={() => onChat(user.uid)}
        style={{
          width: "100%", background: fill, color: "#fff",
          border: "none", borderRadius: 12, padding: "11px 0",
          fontSize: 14, fontWeight: 600, cursor: "pointer",
          letterSpacing: "0.01em", transition: "opacity 0.15s",
        }}
        onMouseOver={e => (e.currentTarget.style.opacity = "0.88")}
        onMouseOut={e => (e.currentTarget.style.opacity = "1")}
      >
        Start conversation →
      </button>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function MapScreen({ onChatRequest }: { onChatRequest?: (uid: string) => void }) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const svgOverlayRef = useRef<SVGSVGElement | null>(null);
  const [leafletLoaded, setLeafletLoaded] = useState(false);
  const [selectedUser, setSelectedUser] = useState<NearbyUser | null>(null);

  // ── Load Leaflet dynamically ────────────────────────────────────────────────
  useEffect(() => {
    if (typeof window === "undefined") return;
    if ((window as any).L) { setLeafletLoaded(true); return; }

    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    document.head.appendChild(link);

    const script = document.createElement("script");
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.onload = () => setLeafletLoaded(true);
    document.head.appendChild(script);
  }, []);

  // ── Init map ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!leafletLoaded || !mapRef.current || mapInstanceRef.current) return;

    const L = (window as any).L;

    const map = L.map(mapRef.current, {
      center: [HARDCODED_CENTER.lat, HARDCODED_CENTER.lng],
      zoom: 15,
      zoomControl: false,
      attributionControl: false,
    });

    L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
      maxZoom: 19,
    }).addTo(map);

    L.control.zoom({ position: "bottomright" }).addTo(map);

    mapInstanceRef.current = map;
  }, [leafletLoaded]);

  // ── Draw markers + strings ──────────────────────────────────────────────────
  const redrawMarkers = useCallback(() => {
    const L = (window as any).L;
    const map = mapInstanceRef.current;
    if (!map || !L) return;

    // Clear old markers
    map.eachLayer((layer: any) => {
      if (layer._wavelengthMarker) map.removeLayer(layer);
    });

    // Clear old SVG overlay
    if (svgOverlayRef.current) {
      svgOverlayRef.current.remove();
      svgOverlayRef.current = null;
    }

    // SVG overlay for red strings
    const mapPane = map.getPanes().mapPane as HTMLElement;
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.style.cssText = "position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:400;overflow:visible;";
    mapPane.appendChild(svg);
    svgOverlayRef.current = svg;

    function getLayerPoint(lat: number, lng: number) {
      return map.latLngToLayerPoint([lat, lng]);
    }

    // You-are-here teal dot
    // TODO: swap HARDCODED_CENTER for navigator.geolocation coords when backend is ready
    const youIcon = L.divIcon({
      className: "",
      html: `<div style="
        width:16px;height:16px;
        background:#1abc9c;
        border:3px solid white;
        border-radius:50%;
        box-shadow:0 0 0 4px rgba(26,188,156,0.25);
      "></div>`,
      iconSize: [16, 16],
      iconAnchor: [8, 8],
    });
    const youMarker = L.marker([HARDCODED_CENTER.lat, HARDCODED_CENTER.lng], { icon: youIcon });
    youMarker._wavelengthMarker = true;
    youMarker.addTo(map);

    // Heart markers + red strings
    HARDCODED_USERS.forEach(user => {
      const { fill, glow, text } = similarityToColor(user.similarity);
      const pct = Math.round(user.similarity * 100);

      const heartIcon = L.divIcon({
        className: "",
        html: `
          <div style="position:relative;width:52px;height:52px;cursor:pointer;">
            <div style="
              position:absolute;inset:-6px;border-radius:50%;
              background:${glow};filter:blur(8px);
            "></div>
            <svg width="52" height="52" viewBox="-26 -26 52 52"
              style="position:relative;filter:drop-shadow(0 2px 6px rgba(0,0,0,0.15));">
              <path d="${HEART_PATH}" fill="${fill}" />
              <text x="0" y="5" text-anchor="middle"
                font-family="'DM Sans',system-ui,sans-serif"
                font-size="8" font-weight="700" fill="${text}"
              >${pct}%</text>
            </svg>
          </div>
        `,
        iconSize: [52, 52],
        iconAnchor: [26, 26],
      });

      const marker = L.marker([user.lat, user.lng], { icon: heartIcon });
      marker._wavelengthMarker = true;
      marker.on("click", () => setSelectedUser(user));
      marker.addTo(map);

      // Draw red string from center to heart
      const from = getLayerPoint(HARDCODED_CENTER.lat, HARDCODED_CENTER.lng);
      const to = getLayerPoint(user.lat, user.lng);

      const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
      line.setAttribute("x1", String(from.x));
      line.setAttribute("y1", String(from.y));
      line.setAttribute("x2", String(to.x));
      line.setAttribute("y2", String(to.y));
      line.setAttribute("stroke", fill);
      line.setAttribute("stroke-width", "1.2");
      line.setAttribute("stroke-opacity", String(0.35 + user.similarity * 0.45));
      svg.appendChild(line);
    });

    // Keep strings locked on pan/zoom
    function onMoveUpdate() {
      if (!svgOverlayRef.current) return;
      const lines = svgOverlayRef.current.querySelectorAll("line");
      HARDCODED_USERS.forEach((user, i) => {
        const from = getLayerPoint(HARDCODED_CENTER.lat, HARDCODED_CENTER.lng);
        const to = getLayerPoint(user.lat, user.lng);
        const line = lines[i];
        if (!line) return;
        line.setAttribute("x1", String(from.x));
        line.setAttribute("y1", String(from.y));
        line.setAttribute("x2", String(to.x));
        line.setAttribute("y2", String(to.y));
      });
    }

    map.on("move zoom", onMoveUpdate);
    return () => map.off("move zoom", onMoveUpdate);
  }, []);

  useEffect(() => {
    if (mapInstanceRef.current && leafletLoaded) redrawMarkers();
  }, [leafletLoaded, redrawMarkers]);

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div style={{
      position: "relative", width: "100%", height: "100vh",
      fontFamily: "'DM Sans', system-ui, sans-serif", overflow: "hidden",
    }}>
      <div ref={mapRef} style={{ width: "100%", height: "100%" }} />

      {/* Top nav */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: 64,
        background: "rgba(255,255,255,0.92)", backdropFilter: "blur(12px)",
        borderBottom: "0.5px solid rgba(0,0,0,0.07)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 20px", zIndex: 800,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <svg width={20} height={14} viewBox="0 0 20 14">
            <polyline points="0,7 3,2 6,12 9,4 12,10 15,7 18,7"
              fill="none" stroke="#C0392B" strokeWidth={1.8}
              strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span style={{ fontSize: 17, fontWeight: 600, color: "#1a1a1a", letterSpacing: "-0.3px" }}>
            wavelength
          </span>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button style={{
            background: "white", border: "0.5px solid rgba(0,0,0,0.12)",
            borderRadius: 20, padding: "7px 16px",
            fontSize: 13, fontWeight: 500, color: "#333", cursor: "pointer",
          }}>Find your people nearby</button>
          <button style={{
            background: "none", border: "none",
            fontSize: 13, fontWeight: 500, color: "#666",
            cursor: "pointer", padding: "7px 8px",
          }}>My Profile</button>
        </div>
        <div style={{
          width: 34, height: 34, borderRadius: "50%", background: "#F5B8B0",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 13, fontWeight: 700, color: "#C0392B",
        }}>A</div>
      </div>

      {/* Bottom-left stats card */}
      <div style={{
        position: "absolute", bottom: 24, left: 20,
        background: "rgba(255,255,255,0.94)", backdropFilter: "blur(10px)",
        borderRadius: 16, padding: "14px 18px",
        boxShadow: "0 2px 20px rgba(0,0,0,0.10)",
        zIndex: 800, minWidth: 180,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#1abc9c" }} />
          <span style={{ fontSize: 13, color: "#444", fontWeight: 500 }}>You are here</span>
        </div>
        <div style={{ fontSize: 12, color: "#888", marginBottom: 10 }}>
          People nearby: <strong style={{ color: "#333" }}>{HARDCODED_USERS.length}</strong>
        </div>
        <div style={{ fontSize: 11, color: "#aaa", fontWeight: 600, letterSpacing: "0.04em", marginBottom: 5 }}>
          COMPATIBILITY
        </div>
        <div style={{
          height: 4, borderRadius: 2,
          background: "linear-gradient(to right, #FAD7D3, #C0392B)",
          marginBottom: 4,
        }} />
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#aaa" }}>
          <span>40%</span><span>90%</span>
        </div>
      </div>

      {/* Top-right info card */}
      <div style={{
        position: "absolute", top: 80, right: 20,
        background: "rgba(255,255,255,0.96)", backdropFilter: "blur(10px)",
        borderRadius: 20, padding: "18px 20px",
        boxShadow: "0 2px 20px rgba(0,0,0,0.10)",
        zIndex: 800, maxWidth: 240,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
          <span style={{ color: "#C0392B", fontSize: 12 }}>✦</span>
          <span style={{ fontSize: 12, color: "#C0392B", fontWeight: 600 }}>Anonymous & mutual</span>
        </div>
        <p style={{ fontSize: 15, lineHeight: 1.5, color: "#1a1a1a", fontWeight: 500, marginBottom: 6 }}>
          The person next to you might be your{" "}
          <span style={{ color: "#C0392B", fontWeight: 700 }}>people.</span>
        </p>
        <p style={{ fontSize: 13, color: "#888", marginBottom: 14, lineHeight: 1.5 }}>
          You just don't know it yet.
        </p>
        <button style={{
          background: "none", border: "none",
          fontSize: 13, color: "#C0392B", fontWeight: 600,
          cursor: "pointer", padding: 0,
        }}>How it works →</button>
      </div>

      {/* Profile popup on heart click */}
      {selectedUser && (
        <ProfilePopup
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
          onChat={(uid) => {
            setSelectedUser(null);
            onChatRequest?.(uid);
          }}
        />
      )}
    </div>
  );
}
