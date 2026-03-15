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

type ChatMessage = {
  conversationId: string;
  fromId: string;
  toId: string;
  text: string;
  timestamp: number;
};

type PendingRequest = {
  fromId: string;
  toId: string;
  preview: string;
  timestamp: number;
};

type AcceptedConvo = {
  conversationId: string;
  peerId: string;
  peerName: string;
  peerUid: string;
  similarity: number;
  sharedInterests: string[];
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function similarityToColor(score: number): { fill: string; glow: string; text: string } {
  if (score >= 0.85) return { fill: "#C0392B", glow: "rgba(192,57,43,0.35)", text: "#fff" };
  if (score >= 0.70) return { fill: "#E05B4B", glow: "rgba(224,91,75,0.30)", text: "#fff" };
  if (score >= 0.55) return { fill: "#EF8C7E", glow: "rgba(239,140,126,0.25)", text: "#fff" };
  if (score >= 0.40) return { fill: "#F5B8B0", glow: "rgba(245,184,176,0.20)", text: "#9a3a30" };
  return { fill: "#FAD7D3", glow: "rgba(250,215,211,0.15)", text: "#b05048" };
}

function getConvoId(a: string, b: string) { return [a, b].sort().join(":"); }

const HEART_SIZE_BASE = 56;
const HEART_SIZE_MAX = 80;

// ─── Heart marker builder ────────────────────────────────────────────────────

function buildCuteHeart(_fill: string, _glow: string, _textColor: string, pct: number, index: number, hasPendingRequest = false, hasActiveConvo = false): string {
  const delay = (index * 0.4) % 2.8;
  const score01 = pct / 100;
  const size = Math.round(HEART_SIZE_BASE + score01 * (HEART_SIZE_MAX - HEART_SIZE_BASE));
  const saturate = (0.1 + score01 * 1.25).toFixed(2);
  const brightness = (0.82 + score01 * 0.32).toFixed(2);

  const pulseClass = hasPendingRequest ? "wl-heart-pulse" : "";
  const badgeTop = Math.round(size * 0.08);
  const badgeRight = Math.round(size * 0.08);
  const badge = hasPendingRequest
    ? `<div style="position:absolute;top:${badgeTop}px;right:${badgeRight}px;width:18px;height:18px;background:#C0392B;border:2.5px solid white;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:9px;color:white;font-weight:700;z-index:5;box-shadow:0 1px 4px rgba(192,57,43,0.3);">!</div>`
    : hasActiveConvo
    ? `<div style="position:absolute;top:${badgeTop}px;right:${badgeRight}px;width:18px;height:18px;background:#1abc9c;border:2.5px solid white;border-radius:50%;display:flex;align-items:center;justify-content:center;z-index:5;box-shadow:0 1px 4px rgba(26,188,156,0.3);"><svg width="9" height="9" viewBox="0 0 24 24" fill="white"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg></div>`
    : "";

  return `
    <div class="wl-heart ${pulseClass}" style="
      position:relative;
      width:${size}px;height:${size}px;
      cursor:pointer;
      animation: wl-float ${2.5 + (index % 3) * 0.3}s ease-in-out ${delay}s infinite;
    ">
      ${badge}
      <img
        src="/heart-3d.png"
        width="${size}" height="${size}"
        draggable="false"
        style="
          display:block;
          width:${size}px;height:${size}px;
          object-fit:contain;
          filter:
            saturate(${saturate})
            brightness(${brightness})
            drop-shadow(0 3px 8px rgba(120,20,20,0.2));
        "
      />
      <div style="
        position:absolute;inset:0;
        display:flex;align-items:center;justify-content:center;
        padding-bottom:2px;
        font-family:'DM Sans',system-ui,sans-serif;
        font-size:${Math.round(size * 0.22)}px;
        font-weight:700;
        color:white;
        text-shadow:0 1px 3px rgba(0,0,0,0.4);
        pointer-events:none;
      ">${pct}%</div>
    </div>
  `;
}

// ─── Inject styles ───────────────────────────────────────────────────────────
let stylesInjected = false;
function injectStyles() {
  if (stylesInjected || typeof document === "undefined") return;
  stylesInjected = true;
  const s = document.createElement("style");
  s.textContent = `
    @keyframes wl-float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-5px); } }
    @keyframes wl-pulse { 0%, 100% { filter: drop-shadow(0 0 0px rgba(192,57,43,0)); } 50% { filter: drop-shadow(0 0 14px rgba(192,57,43,0.6)); } }
    .wl-heart img { transition: transform 0.18s cubic-bezier(0.34,1.56,0.64,1); }
    .wl-heart:hover img { transform: scale(1.08); }
    .wl-heart-pulse img { animation: wl-pulse 1.2s ease-in-out infinite; }
    .leaflet-marker-icon.leaflet-wavelength-heart { width: ${HEART_SIZE_MAX}px !important; height: ${HEART_SIZE_MAX}px !important; margin-left: -${HEART_SIZE_MAX / 2}px !important; margin-top: -${HEART_SIZE_MAX / 2}px !important; }
    .leaflet-marker-icon.leaflet-wavelength-heart.wl-heart-selected .wl-heart { box-shadow: 0 0 0 6px rgba(192,57,43,0.14), 0 10px 26px rgba(0,0,0,0.22); border-radius: 50%; }
    .leaflet-marker-icon.leaflet-wavelength-heart.wl-heart-selected .wl-heart img { transform: scale(1.12); }
    @keyframes slideInRight { from { transform: translateX(100%); opacity:0; } to { transform: translateX(0); opacity:1; } }
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

// ─── Profile Popup ───────────────────────────────────────────────────────────

function ProfilePopup({ user, onClose, onChat, mode, pendingPreview, onAccept, onDecline, onGoToChat }: {
  user: NearbyUser; onClose: () => void; onChat: (uid: string) => void;
  mode: "normal" | "incoming" | "active"; pendingPreview?: string;
  onAccept?: () => void; onDecline?: () => void; onGoToChat?: () => void;
}) {
  const pct = Math.round(user.similarity * 100);
  const { fill } = similarityToColor(user.similarity);
  return (
    <div style={{ position:"absolute",bottom:24,left:"50%",transform:"translateX(-50%)",width:300,background:"white",borderRadius:20,boxShadow:"0 8px 40px rgba(0,0,0,0.18)",padding:"20px 20px 16px",zIndex:1000,fontFamily:"'DM Sans',system-ui,sans-serif" }}>
      <button onClick={onClose} style={{ position:"absolute",top:12,right:14,background:"none",border:"none",fontSize:18,color:"#aaa",cursor:"pointer",lineHeight:1 }}>×</button>
      <div style={{ display:"inline-flex",alignItems:"center",gap:5,background:"#FFF5F4",border:"1px solid #FFD5CF",borderRadius:99,padding:"3px 10px",fontSize:11,color:"#C0392B",fontWeight:600,marginBottom:12,letterSpacing:"0.03em" }}>
        <span style={{ fontSize:10 }}>✦</span>
        {mode === "incoming" ? "SOMEONE SAID HEY" : mode === "active" ? "CONNECTED" : "MUTUAL VIBES ONLY"}
      </div>
      <div style={{ display:"flex",alignItems:"center",gap:14,marginBottom:14 }}>
        <div style={{ position:"relative",width:56,height:56,flexShrink:0 }}>
          <svg width={56} height={56} viewBox="0 0 56 56">
            <circle cx={28} cy={28} r={22} fill="none" stroke="#FDE8E6" strokeWidth={5}/>
            <circle cx={28} cy={28} r={22} fill="none" stroke={fill} strokeWidth={5} strokeDasharray={`${2*Math.PI*22}`} strokeDashoffset={`${2*Math.PI*22*(1-user.similarity)}`} strokeLinecap="round" transform="rotate(-90 28 28)"/>
          </svg>
          <span style={{ position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:700,color:fill }}>{pct}%</span>
        </div>
        <div>
          <div style={{ fontSize:15,fontWeight:600,color:"#1a1a1a",marginBottom:2 }}>{mode==="active"?user.name:pct>=80?"Strong match":pct>=60?"Good match":"Possible match"}</div>
          <div style={{ fontSize:12,color:"#888" }}>{mode==="active"?`${pct}% compatible`:"Someone nearby"}</div>
        </div>
      </div>
      <div style={{ marginBottom:14 }}>
        <div style={{ fontSize:11,color:"#aaa",fontWeight:600,letterSpacing:"0.05em",marginBottom:6 }}>BOTH INTO</div>
        <div style={{ display:"flex",flexWrap:"wrap",gap:5 }}>
          {user.sharedInterests.map(tag=>(<span key={tag} style={{ background:"#FFF5F4",color:"#C0392B",border:"1px solid #FFD5CF",borderRadius:99,padding:"3px 10px",fontSize:12,fontWeight:500 }}>{tag}</span>))}
        </div>
      </div>
      {mode==="incoming"&&pendingPreview&&(<div style={{ background:"#FFF5F4",borderRadius:12,padding:"10px 12px",marginBottom:14,fontSize:13,color:"#5a1e1a",lineHeight:1.5,borderLeft:"3px solid #C0392B" }}>"{pendingPreview}"</div>)}
      {mode==="incoming"&&(<div style={{ display:"flex",gap:8 }}><button onClick={onDecline} style={{ flex:1,background:"#fff",color:"#666",border:"1px solid rgba(0,0,0,0.12)",borderRadius:12,padding:"11px 0",fontSize:14,fontWeight:500,cursor:"pointer" }}>Not now</button><button onClick={onAccept} style={{ flex:1,background:"#C0392B",color:"#fff",border:"none",borderRadius:12,padding:"11px 0",fontSize:14,fontWeight:600,cursor:"pointer" }}>Accept & chat</button></div>)}
      {mode==="active"&&(<button onClick={onGoToChat} style={{ width:"100%",background:"#1abc9c",color:"#fff",border:"none",borderRadius:12,padding:"11px 0",fontSize:14,fontWeight:600,cursor:"pointer" }}>Go to their chat →</button>)}
      {mode==="normal"&&(<button onClick={()=>onChat(user.uid)} style={{ width:"100%",background:fill,color:"#fff",border:"none",borderRadius:12,padding:"11px 0",fontSize:14,fontWeight:600,cursor:"pointer" }} onMouseOver={e=>(e.currentTarget.style.opacity="0.88")} onMouseOut={e=>(e.currentTarget.style.opacity="1")}>Start conversation →</button>)}
    </div>
  );
}

// ─── Side Panel Chat ─────────────────────────────────────────────────────────

function ChatPanel({ open, onClose, peer, messages, myId, onSend }: {
  open: boolean; onClose: () => void; peer: AcceptedConvo | null;
  messages: ChatMessage[]; myId: string | null; onSend: (text: string) => void;
}) {
  const [draft, setDraft] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages.length]);
  if (!open || !peer || !myId) return null;
  return (
    <div style={{ position:"absolute",top:0,right:0,bottom:0,width:360,background:"white",zIndex:950,display:"flex",flexDirection:"column",boxShadow:"-4px 0 30px rgba(0,0,0,0.1)",animation:"slideInRight 0.25s ease-out",fontFamily:"'DM Sans',system-ui,sans-serif" }}>
      <div style={{ padding:"16px 20px",borderBottom:"1px solid rgba(0,0,0,0.06)",display:"flex",alignItems:"center",gap:12 }}>
        <button onClick={onClose} style={{ background:"none",border:"none",fontSize:20,color:"#aaa",cursor:"pointer",lineHeight:1,padding:0 }}>←</button>
        <div style={{ flex:1 }}><div style={{ fontSize:15,fontWeight:600,color:"#1a1a1a" }}>{peer.peerName}</div><div style={{ fontSize:12,color:"#999" }}>{peer.similarity?Math.round(peer.similarity*100)+"% compatible":""}</div></div>
        <div style={{ display:"flex",flexWrap:"wrap",gap:3,maxWidth:140 }}>{peer.sharedInterests?.slice(0,2).map(t=>(<span key={t} style={{ fontSize:9,padding:"2px 6px",background:"#FFF5F4",color:"#C0392B",borderRadius:99,fontWeight:500 }}>{t}</span>))}</div>
      </div>
      <div style={{ flex:1,overflowY:"auto",padding:"12px 16px" }}>
        {messages.length===0&&<p style={{ color:"#bbb",fontSize:13,textAlign:"center",marginTop:40 }}>You're connected! Say something.</p>}
        {messages.map(m=>{const mine=m.fromId===myId;return(<div key={m.timestamp+m.fromId} style={{ display:"flex",justifyContent:mine?"flex-end":"flex-start",marginBottom:6 }}><div style={{ maxWidth:"75%",padding:"8px 12px",borderRadius:16,fontSize:13,lineHeight:1.5,background:mine?"#C0392B":"#F5F5F5",color:mine?"#fff":"#1a1a1a",borderBottomRightRadius:mine?4:16,borderBottomLeftRadius:mine?16:4 }}>{m.text}</div></div>);})}
        <div ref={endRef}/>
      </div>
      <form onSubmit={e=>{e.preventDefault();if(!draft.trim())return;onSend(draft.trim());setDraft("");}} style={{ padding:"12px 16px",borderTop:"1px solid rgba(0,0,0,0.06)",display:"flex",gap:8 }}>
        <input value={draft} onChange={e=>setDraft(e.target.value)} placeholder="Type a message…" style={{ flex:1,borderRadius:24,border:"1px solid rgba(0,0,0,0.1)",padding:"10px 16px",fontSize:13,outline:"none" }}/>
        <button type="submit" style={{ borderRadius:24,border:"none",padding:"10px 18px",fontSize:13,fontWeight:600,background:"#C0392B",color:"#fff",cursor:"pointer" }}>Send</button>
      </form>
    </div>
  );
}

// ─── Inbox Panel ─────────────────────────────────────────────────────────────

function InboxPanel({ open, onClose, convos, messages, onSelect }: {
  open: boolean; onClose: () => void; convos: AcceptedConvo[];
  messages: Record<string, ChatMessage[]>; onSelect: (c: AcceptedConvo) => void;
}) {
  if (!open) return null;
  return (
    <div style={{ position:"absolute",top:0,right:0,bottom:0,width:360,background:"white",zIndex:950,display:"flex",flexDirection:"column",boxShadow:"-4px 0 30px rgba(0,0,0,0.1)",animation:"slideInRight 0.25s ease-out",fontFamily:"'DM Sans',system-ui,sans-serif" }}>
      <div style={{ padding:"16px 20px",borderBottom:"1px solid rgba(0,0,0,0.06)",display:"flex",alignItems:"center",gap:12 }}>
        <button onClick={onClose} style={{ background:"none",border:"none",fontSize:20,color:"#aaa",cursor:"pointer",lineHeight:1,padding:0 }}>←</button>
        <div style={{ fontSize:16,fontWeight:600,color:"#1a1a1a" }}>Messages</div>
      </div>
      <div style={{ flex:1,overflowY:"auto" }}>
        {convos.length===0&&<p style={{ color:"#bbb",fontSize:13,textAlign:"center",marginTop:40,padding:"0 20px" }}>No conversations yet. Tap a heart on the map to start one.</p>}
        {convos.map(c=>{const msgs=messages[c.conversationId]??[];const last=msgs[msgs.length-1];return(
          <button key={c.conversationId} onClick={()=>onSelect(c)} style={{ width:"100%",padding:"14px 20px",background:"transparent",border:"none",borderBottom:"1px solid rgba(0,0,0,0.04)",display:"flex",alignItems:"center",gap:12,cursor:"pointer",textAlign:"left" }}>
            <div style={{ width:40,height:40,borderRadius:"50%",background:"#F5B8B0",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:700,color:"#C0392B",flexShrink:0 }}>{c.peerName.charAt(0)}</div>
            <div style={{ flex:1,minWidth:0 }}><div style={{ fontSize:14,fontWeight:600,color:"#1a1a1a" }}>{c.peerName}</div><div style={{ fontSize:12,color:"#999",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis" }}>{last?last.text:"Start chatting…"}</div></div>
            <div style={{ fontSize:11,color:"#ccc",flexShrink:0 }}>{last?new Date(last.timestamp).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}):""}</div>
          </button>);})}
      </div>
    </div>
  );
}

// ─── Toast ───────────────────────────────────────────────────────────────────

function Toast({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  useEffect(() => { const t = setTimeout(onDismiss, 5000); return () => clearTimeout(t); }, [onDismiss]);
  return (
    <div onClick={onDismiss} style={{ position:"absolute",top:80,left:"50%",transform:"translateX(-50%)",background:"rgba(255,255,255,0.96)",backdropFilter:"blur(12px)",borderRadius:14,padding:"10px 18px",boxShadow:"0 4px 24px rgba(0,0,0,0.12)",zIndex:999,cursor:"pointer",display:"flex",alignItems:"center",gap:8,fontFamily:"'DM Sans',system-ui,sans-serif",fontSize:13,fontWeight:500,color:"#1a1a1a",maxWidth:340 }}>
      <span style={{ fontSize:16 }}>💓</span>{message}
    </div>
  );
}

// ─── ChatOverlay (pre-accept opener) ─────────────────────────────────────────

function ChatOverlay({ open, onClose, peer, messages, myId, onSend, pendingIntro, canSendMore }: {
  open: boolean; onClose: () => void; peer: NearbyUser | null;
  messages: ChatMessage[]; myId: string | null; onSend: (text: string) => void;
  pendingIntro: boolean; canSendMore: boolean;
}) {
  const [draft, setDraft] = useState("");
  if (!open || !peer || !myId) return null;
  return (
    <div style={{ position:"absolute",right:20,bottom:24,width:280,maxHeight:360,background:"rgba(255,255,255,0.98)",borderRadius:18,boxShadow:"0 10px 40px rgba(0,0,0,0.18)",display:"flex",flexDirection:"column",overflow:"hidden",zIndex:900,fontFamily:"'DM Sans',system-ui,sans-serif" }}>
      <div style={{ padding:"10px 12px",borderBottom:"1px solid rgba(0,0,0,0.06)",display:"flex",alignItems:"center",justifyContent:"space-between" }}>
        <div><div style={{ fontSize:13,fontWeight:600,color:"#1a1a1a" }}>Send a message</div><div style={{ fontSize:11,color:"#999" }}>They'll see it as a request</div></div>
        <button onClick={onClose} style={{ border:"none",background:"transparent",fontSize:16,color:"#bbb",cursor:"pointer" }}>×</button>
      </div>
      <div style={{ flex:1,padding:"8px 10px 6px",overflowY:"auto",fontSize:12 }}>
        {messages.length===0&&<p style={{ margin:0,padding:"6px 4px 10px",color:"#999" }}>{pendingIntro?"Send a first message. They'll see it with an option to say hi back.":"Waiting for them to accept…"}</p>}
        {messages.map(m=>{const mine=m.fromId===myId;return(<div key={m.timestamp+m.fromId} style={{ display:"flex",justifyContent:mine?"flex-end":"flex-start",marginBottom:4 }}><div style={{ maxWidth:"80%",padding:"6px 9px",borderRadius:12,fontSize:12,lineHeight:1.4,background:mine?"#C0392B":"#F5B8B0",color:mine?"#fff":"#5a1e1a" }}>{m.text}</div></div>);})}
      </div>
      <form onSubmit={e=>{e.preventDefault();if(!draft.trim()||!canSendMore)return;onSend(draft.trim());setDraft("");}} style={{ padding:"6px 8px 8px",borderTop:"1px solid rgba(0,0,0,0.06)",display:"flex",gap:6 }}>
        <input value={draft} onChange={e=>setDraft(e.target.value)} placeholder={canSendMore?"Send a quick hello…":"Waiting for them to accept…"} disabled={!canSendMore} style={{ flex:1,borderRadius:999,border:"1px solid rgba(0,0,0,0.12)",padding:"6px 10px",fontSize:12,outline:"none" }}/>
        <button type="submit" style={{ borderRadius:999,border:"none",padding:"6px 10px",fontSize:11,fontWeight:600,background:"#C0392B",color:"#fff",cursor:canSendMore?"pointer":"not-allowed",opacity:canSendMore?1:0.6 }} disabled={!canSendMore}>Send</button>
      </form>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function MapScreen({ onChatRequest }: { onChatRequest?: (uid: string) => void }) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const [leafletLoaded, setLeafletLoaded] = useState(false);
  const [selectedUser, setSelectedUser] = useState<NearbyUser | null>(null);

  // ── Shared socket from hook — single connection for location + chat ──
  const { socket, nearbyUsersRaw, userId: myId } = useLocationSocketSync();
  const { position } = useLiveLocation();
  const center = position ? { lat: position.lat, lng: position.lng } : { lat: 0, lng: 0 };

  // Map raw backend payload → NearbyUser[]
  const nearbyUsers: NearbyUser[] = (nearbyUsersRaw ?? []).map((hit: any) => {
    const rawScore = typeof hit.similarity === "number" ? hit.similarity : 0;
    return {
      uid: hit.userId,
      lat: hit.location?.lat ?? 0,
      lng: hit.location?.lon ?? 0,
      similarity: Math.min(1, Math.max(0, rawScore)),
      sharedInterests: Array.isArray(hit.sharedInterests) ? hit.sharedInterests : [],
      name: hit.name,
    };
  });

  const displayUsers = nearbyUsers;
  const displayUsersRef = useRef<NearbyUser[]>(displayUsers);
  displayUsersRef.current = displayUsers;

  // Messaging state
  const [pendingRequests, setPendingRequests] = useState<Record<string, PendingRequest>>({});
  const [sentRequests, setSentRequests] = useState<Record<string, string>>({});
  const [acceptedConvos, setAcceptedConvos] = useState<AcceptedConvo[]>([]);
  const [conversations, setConversations] = useState<Record<string, ChatMessage[]>>({});
  const [activeChatConvo, setActiveChatConvo] = useState<AcceptedConvo | null>(null);
  const [chatPanelOpen, setChatPanelOpen] = useState(false);
  const [inboxOpen, setInboxOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [chatOverlayPeer, setChatOverlayPeer] = useState<NearbyUser | null>(null);
  const [chatOverlayOpen, setChatOverlayOpen] = useState(false);
  const [chatOverlayCid, setChatOverlayCid] = useState<string | null>(null);

  const getAcceptedConvo = useCallback((uid: string) => acceptedConvos.find(c => c.peerUid === uid) ?? null, [acceptedConvos]);
  const getPendingFrom = useCallback((uid: string) => pendingRequests[uid] ?? null, [pendingRequests]);

  // ── Load Leaflet ──
  useEffect(() => {
    if (typeof window === "undefined") return;
    injectStyles();
    if ((window as any).L) { setLeafletLoaded(true); return; }
    const link = document.createElement("link"); link.rel = "stylesheet"; link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"; document.head.appendChild(link);
    const script = document.createElement("script"); script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"; script.onload = () => setLeafletLoaded(true); document.head.appendChild(script);
  }, []);

  // ── Chat listeners on the shared socket ──
  useEffect(() => {
    if (!socket || !myId) return;

    const onIncoming = (payload: { fromId: string; preview?: string }) => {
      setPendingRequests(prev => ({ ...prev, [payload.fromId]: { fromId: payload.fromId, toId: myId, preview: payload.preview ?? "", timestamp: Date.now() } }));
      setToastMessage("Someone on your wavelength said hey 💓");
    };
    const onAccepted = (payload: { conversationId: string; peerId: string; peerName: string }) => {
      const peer = displayUsersRef.current.find(u => u.uid === payload.peerId);
      const convo: AcceptedConvo = { conversationId: payload.conversationId, peerId: payload.peerId, peerName: payload.peerName, peerUid: payload.peerId, similarity: peer?.similarity ?? 0, sharedInterests: peer?.sharedInterests ?? [] };
      setAcceptedConvos(prev => prev.some(c => c.conversationId === convo.conversationId) ? prev : [...prev, convo]);
      setSentRequests(prev => { const n = { ...prev }; delete n[payload.peerId]; return n; });
      setChatOverlayOpen(false);
      setToastMessage(`${payload.peerName ?? "Someone"} accepted your message! 🎉`);
    };
    const onMessage = (payload: ChatMessage) => {
      setConversations(prev => ({ ...prev, [payload.conversationId]: [...(prev[payload.conversationId] ?? []), payload] }));
    };

    socket.on("chat:incoming", onIncoming);
    socket.on("chat:accepted", onAccepted);
    socket.on("chat:message", onMessage);
    return () => { socket.off("chat:incoming", onIncoming); socket.off("chat:accepted", onAccepted); socket.off("chat:message", onMessage); };
  }, [socket, myId]);

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

  // Center map on real position
  useEffect(() => {
    if (!position || !mapInstanceRef.current) return;
    mapInstanceRef.current.setView([position.lat, position.lng], mapInstanceRef.current.getZoom(), { animate: true });
  }, [position?.lat, position?.lng]);

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

      const hasPending = !!pendingRequests[user.uid];
      const hasActive = acceptedConvos.some(c => c.peerUid === user.uid);
      const heartIcon = L.divIcon({ className: "leaflet-wavelength-heart", html: buildCuteHeart(fill, glow, text, pct, i, hasPending, hasActive), iconSize: [HEART_SIZE_MAX, HEART_SIZE_MAX], iconAnchor: [HEART_SIZE_MAX/2, HEART_SIZE_MAX/2] });
      const marker = L.marker([user.lat, user.lng], { icon: heartIcon }); marker._wavelength = true;
      marker.on("click", () => {
        document.querySelectorAll(".leaflet-wavelength-heart.wl-heart-selected").forEach(el => el.classList.remove("wl-heart-selected"));
        ((marker as any)._icon as HTMLElement)?.classList.add("wl-heart-selected");
        map.setView([user.lat, user.lng], Math.max(map.getZoom(), 16), { animate: true });
        setSelectedUser(user); setChatOverlayOpen(false);
      });
      marker.addTo(map);
    });
  }, [pendingRequests, acceptedConvos, center.lat, center.lng, displayUsers]);

  useEffect(() => { if (mapInstanceRef.current && leafletLoaded) redrawMarkers(); }, [leafletLoaded, redrawMarkers]);

  // ── Unread tracking ──
  const [lastReadTimestamps, setLastReadTimestamps] = useState<Record<string, number>>({});
  const markAsRead = useCallback((convoId: string) => { setLastReadTimestamps(prev => ({ ...prev, [convoId]: Date.now() })); }, []);
  const unreadCount = acceptedConvos.reduce((total, c) => {
    const msgs = conversations[c.conversationId] ?? [];
    const lastRead = lastReadTimestamps[c.conversationId] ?? 0;
    return total + msgs.filter(m => m.fromId !== myId && m.timestamp > lastRead).length;
  }, 0) + Object.keys(pendingRequests).length;

  useEffect(() => { if (chatPanelOpen && activeChatConvo) markAsRead(activeChatConvo.conversationId); }, [chatPanelOpen, activeChatConvo, conversations, markAsRead]);

  const popupMode: "normal" | "incoming" | "active" = selectedUser
    ? getAcceptedConvo(selectedUser.uid) ? "active" : getPendingFrom(selectedUser.uid) ? "incoming" : "normal"
    : "normal";

  // ── Render ──
  return (
    <div style={{ position:"relative",width:"100%",height:"100vh",fontFamily:"'DM Sans',system-ui,sans-serif",overflow:"hidden" }}>
      <div ref={mapRef} style={{ width:"100%",height:"100%" }}/>
      {toastMessage && <Toast message={toastMessage} onDismiss={() => setToastMessage(null)}/>}

      {/* Nav */}
      <div style={{ position:"absolute",top:0,left:0,right:0,height:64,background:"rgba(255,255,255,0.92)",backdropFilter:"blur(12px)",borderBottom:"0.5px solid rgba(0,0,0,0.07)",display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 20px",zIndex:800 }}>
        <Link href="/" style={{ display:"flex",alignItems:"center",gap:8,textDecoration:"none" }}>
          <svg width={20} height={14} viewBox="0 0 20 14"><polyline points="0,7 3,2 6,12 9,4 12,10 15,7 18,7" fill="none" stroke="#C0392B" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"/></svg>
          <span style={{ fontSize:17,fontWeight:600,color:"#1a1a1a",letterSpacing:"-0.3px" }}>wavelength</span>
        </Link>
        <div style={{ display:"flex",gap:8,alignItems:"center" }}>
          <button style={{ background:"white",border:"0.5px solid rgba(0,0,0,0.12)",borderRadius:20,padding:"7px 16px",fontSize:13,fontWeight:500,color:"#333",cursor:"pointer" }}>Find your people nearby</button>
          <button onClick={() => { setInboxOpen(true); setChatPanelOpen(false); }} style={{ position:"relative",background:"white",border:"0.5px solid rgba(0,0,0,0.12)",borderRadius:20,padding:"7px 16px",fontSize:13,fontWeight:500,color:"#333",cursor:"pointer" }}>
            Messages
            {unreadCount > 0 && <span style={{ position:"absolute",top:-4,right:-4,width:18,height:18,background:"#C0392B",color:"white",borderRadius:"50%",fontSize:10,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center",border:"2px solid white" }}>{unreadCount}</span>}
          </button>
          <button style={{ background:"none",border:"none",fontSize:13,fontWeight:500,color:"#666",cursor:"pointer",padding:"7px 8px" }}>My Profile</button>
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
        <p style={{ fontSize:13,color:"#888",marginBottom:14,lineHeight:1.5 }}>You just don't know it yet.</p>
        <Link href="/how-it-works" style={{ background:"none",border:"none",fontSize:13,color:"#C0392B",fontWeight:600,cursor:"pointer",padding:0,textDecoration:"none" }}>How it works →</Link>
      </div>

      {/* Popup */}
      {selectedUser && !chatPanelOpen && !inboxOpen && (
        <ProfilePopup user={selectedUser} onClose={() => setSelectedUser(null)} mode={popupMode}
          pendingPreview={selectedUser ? getPendingFrom(selectedUser.uid)?.preview : undefined}
          onChat={(uid) => {
            setSelectedUser(null); onChatRequest?.(uid);
            setChatOverlayPeer(displayUsers.find(u => u.uid === uid) ?? null);
            setChatOverlayOpen(true);
            if (myId) { const cid = getConvoId(myId, uid); setChatOverlayCid(cid); setConversations(prev => prev[cid] ? prev : { ...prev, [cid]: [] }); }
          }}
          onAccept={() => {
            if (!selectedUser || !socket || !myId) return;
            const req = getPendingFrom(selectedUser.uid); if (!req) return;
            const cid = getConvoId(req.fromId, myId);
            const peer = displayUsers.find(u => u.uid === req.fromId);
            socket.emit("chat:accept", { fromId: req.fromId, toId: myId, conversationId: cid, peerName: "You" });
            const convo: AcceptedConvo = { conversationId: cid, peerId: req.fromId, peerName: peer?.name ?? "Someone", peerUid: req.fromId, similarity: peer?.similarity ?? 0, sharedInterests: peer?.sharedInterests ?? [] };
            setAcceptedConvos(prev => [...prev, convo]);
            setPendingRequests(prev => { const n = { ...prev }; delete n[req.fromId]; return n; });
            setSelectedUser(null); setActiveChatConvo(convo); setChatPanelOpen(true);
          }}
          onDecline={() => { if (!selectedUser) return; setPendingRequests(prev => { const n = { ...prev }; delete n[selectedUser.uid]; return n; }); setSelectedUser(null); }}
          onGoToChat={() => { if (!selectedUser) return; const convo = getAcceptedConvo(selectedUser.uid); if (convo) { setActiveChatConvo(convo); setChatPanelOpen(true); setSelectedUser(null); } }}
        />
      )}

      {/* Pre-accept overlay */}
      {chatOverlayOpen && chatOverlayPeer && !chatPanelOpen && (
        <ChatOverlay open={chatOverlayOpen} onClose={() => setChatOverlayOpen(false)} peer={chatOverlayPeer}
          messages={chatOverlayCid ? conversations[chatOverlayCid] ?? [] : []} myId={myId}
          pendingIntro={chatOverlayCid ? (conversations[chatOverlayCid] ?? []).length === 0 : true}
          canSendMore={chatOverlayCid ? (conversations[chatOverlayCid] ?? []).length === 0 : true}
          onSend={(text) => {
            if (!socket || !myId || !chatOverlayPeer) return;
            const cid = chatOverlayCid ?? getConvoId(myId, chatOverlayPeer.uid);
            const payload: ChatMessage = { conversationId: cid, fromId: myId, toId: chatOverlayPeer.uid, text, timestamp: Date.now() };
            setChatOverlayCid(cid);
            setConversations(prev => ({ ...prev, [cid]: [...(prev[cid] ?? []), payload] }));
            socket.emit("chat:message", payload);
            socket.emit("chat:request", { fromId: myId, toId: chatOverlayPeer.uid, preview: text });
            setSentRequests(prev => ({ ...prev, [chatOverlayPeer.uid]: text }));
          }}
        />
      )}

      {/* Chat panel */}
      <ChatPanel open={chatPanelOpen && !!activeChatConvo} onClose={() => { setChatPanelOpen(false); setActiveChatConvo(null); }}
        peer={activeChatConvo} messages={activeChatConvo ? conversations[activeChatConvo.conversationId] ?? [] : []} myId={myId}
        onSend={(text) => {
          if (!socket || !myId || !activeChatConvo) return;
          const payload: ChatMessage = { conversationId: activeChatConvo.conversationId, fromId: myId, toId: activeChatConvo.peerUid, text, timestamp: Date.now() };
          setConversations(prev => ({ ...prev, [activeChatConvo.conversationId]: [...(prev[activeChatConvo.conversationId] ?? []), payload] }));
          socket.emit("chat:message", payload);
        }}
      />

      {/* Inbox */}
      <InboxPanel open={inboxOpen && !chatPanelOpen} onClose={() => setInboxOpen(false)} convos={acceptedConvos} messages={conversations}
        onSelect={(c) => { setActiveChatConvo(c); setChatPanelOpen(true); setInboxOpen(false); }}
      />
    </div>
  );
}