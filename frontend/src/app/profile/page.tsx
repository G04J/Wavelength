"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";

type Me = { userId?: string; email?: string | null } | null;

const styles = {
  page: {
    minHeight: "100vh",
    background: "#fdf8f6",
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    padding: "2rem",
  },
  nav: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "2rem",
    flexWrap: "wrap" as const,
    gap: "1rem",
  },
  title: {
    fontFamily: "'Playfair Display', serif",
    fontSize: "1.5rem",
    fontWeight: 700,
    color: "#3a1a1a",
  },
  card: {
    maxWidth: 560,
    background: "white",
    borderRadius: 16,
    boxShadow: "0 4px 24px rgba(224, 96, 96, 0.08)",
    padding: "2rem",
    border: "1px solid #f0e0dc",
  },
  subtitle: {
    fontSize: "0.875rem",
    color: "#b08080",
    marginTop: "0.5rem",
  },
  link: {
    color: "#e06060",
    textDecoration: "none",
    fontSize: "0.875rem",
    fontWeight: 500,
  },
  signOut: {
    padding: "0.5rem 1rem",
    borderRadius: 8,
    border: "1px solid #f0e0dc",
    background: "white",
    color: "#b08080",
    fontSize: "0.875rem",
    cursor: "pointer",
    fontFamily: "inherit",
  },
};

export default function ProfilePage() {
  const [me, setMe] = useState<Me>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/me")
      .then((r) => (r.ok ? r.json() : null))
      .then(setMe)
      .finally(() => setLoading(false));
  }, []);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  return (
    <div style={styles.page}>
      <link
        href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap"
        rel="stylesheet"
      />
      <nav style={styles.nav}>
        <Link href="/" style={{ ...styles.link, fontWeight: 600 }}>
          wave~length
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <Link href="/discover" style={styles.link}>
            discover
          </Link>
          <button type="button" onClick={handleSignOut} style={styles.signOut}>
            Sign out
          </button>
        </div>
      </nav>

      <div style={styles.card}>
        <h1 style={styles.title}>Profile setup</h1>
        <p style={styles.subtitle}>
          Choose your interests and find your people nearby. (Coming next.)
        </p>
        {loading ? (
          <p style={styles.subtitle}>Loading…</p>
        ) : me?.userId ? (
          <p style={{ ...styles.subtitle, marginTop: "1rem" }}>
            Signed in as {me.email ?? me.userId}
          </p>
        ) : null}
      </div>
    </div>
  );
}
