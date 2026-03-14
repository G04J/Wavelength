"use client";

import Link from "next/link";

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
};

export default function DiscoverPage() {
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
    </div>
  );
}
