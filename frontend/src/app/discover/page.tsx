"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useLiveLocation } from "@/contexts/LocationContext";
import { useLocationSocketSync } from "@/hooks/useLocationSocketSync";
import { GoogleMap } from "@/components/GoogleMap";

const styles = {
  page: {
    minHeight: "100vh",
    background: "#fdf8f6",
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    padding: "2rem",
  },
  title: {
    fontFamily: "'Playfair Display', serif",
    fontSize: "1.5rem",
    fontWeight: 700,
    color: "#3a1a1a",
  },
  subtitle: { fontSize: "0.875rem", color: "#b08080", marginTop: "0.5rem" },
  link: { color: "#e06060", textDecoration: "none", fontSize: "0.875rem" },
  coords: {
    marginTop: "1rem",
    padding: "0.75rem 1rem",
    background: "rgba(224, 96, 96, 0.08)",
    borderRadius: 10,
    fontSize: "0.8125rem",
    color: "#5a3a3a",
    fontFamily: "monospace",
  },
  status: { fontSize: "0.875rem", color: "#b08080", marginTop: "0.5rem" },
  error: { fontSize: "0.875rem", color: "#c04040", marginTop: "0.5rem" },
  retryButton: {
    marginTop: "0.75rem",
    padding: "0.5rem 1rem",
    borderRadius: 8,
    border: "1px solid #e06060",
    background: "white",
    color: "#e06060",
    fontSize: "0.875rem",
    fontWeight: 600,
    cursor: "pointer",
  },
};

export default function DiscoverPage() {
  const { position, error, status, enableWatching, retry } = useLiveLocation();
  useLocationSocketSync(); // stream live position to backend

  useEffect(() => {
    enableWatching();
  }, [enableWatching]);

  return (
    <div style={styles.page}>
      <link
        href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap"
        rel="stylesheet"
      />
      <nav style={{ marginBottom: "2rem" }}>
        <Link href="/" style={{ ...styles.link, fontWeight: 600 }}>
          wave~length
        </Link>
      </nav>
      <h1 style={styles.title}>Discover</h1>
      <p style={styles.subtitle}>Find your people nearby. (Map and matches coming next.)</p>

      {status === "prompt" && (
        <p style={styles.status}>Requesting location access…</p>
      )}
      {status === "watching" && position && (
        <>
          <GoogleMap
            position={position}
            height="320px"
            apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}
          />
          <div style={styles.coords}>
            Live location: {position.lat.toFixed(6)}, {position.lng.toFixed(6)}
          </div>
        </>
      )}
      {status === "denied" && (
        <p style={styles.error}>Location is disabled. Enable it in your browser to see nearby matches.</p>
      )}
      {status === "unavailable" && error && (
        <div>
          <p style={styles.error}>{error}</p>
          <button type="button" onClick={retry} style={styles.retryButton}>
            Try again
          </button>
        </div>
      )}
    </div>
  );
}
