"use client";

import Link from "next/link";

const styles = {
  page: {
    minHeight: "100vh",
    background: "var(--wl-bg-cream)",
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    padding: "2rem",
  },
  title: {
    fontFamily: "'Playfair Display', serif",
    fontSize: "1.5rem",
    fontWeight: 700,
    color: "var(--wl-text)",
  },
  subtitle: { fontSize: "0.875rem", color: "var(--wl-text-muted)", marginTop: "0.5rem" },
  link: { color: "var(--wl-accent)", textDecoration: "none", fontSize: "0.875rem" },
};

export default function ConnectionsPage() {
  return (
    <div style={styles.page}>
      <link
        href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap"
        rel="stylesheet"
      />
      <nav style={{ marginBottom: "1.25rem", overflow: "visible" }}>
        <Link href="/" style={{ display: "inline-flex", alignItems: "center", overflow: "visible" }}>
          <img
            src="/logo.png"
            alt="Wavelength"
            style={{ height: 48, width: "auto", display: "block", verticalAlign: "middle" }}
          />
        </Link>
      </nav>
      <h1 style={styles.title}>Connections</h1>
      <p style={styles.subtitle}>Your mutual matches will appear here.</p>
    </div>
  );
}
