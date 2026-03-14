"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { getAuthErrorMessage } from "@/utils/authErrors";

const styles = {
  page: {
    minHeight: "100vh",
    background: "var(--wl-bg-cream)",
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    position: "relative" as const,
    overflow: "hidden",
  },
  topImage: {
    position: "absolute" as const,
    top: 0,
    left: 0,
    right: 0,
    height: "60vh",
    minHeight: 420,
    backgroundImage: "url('/profile-bg.png')",
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
    zIndex: 0,
  },
  content: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "2rem",
    position: "relative" as const,
    zIndex: 1,
  },
  card: {
    width: "100%",
    maxWidth: 400,
    background: "rgba(255,255,255,0.9)",
    borderRadius: 16,
    boxShadow:
      "0 0 0 1px rgba(255,255,255,0.9), 0 18px 60px rgba(255,255,255,0.35), 0 10px 36px var(--wl-accent-shadow)",
    padding: "2rem",
    border: "1px solid var(--wl-border)",
    backdropFilter: "blur(10px)",
  },
  title: {
    fontFamily: "'Playfair Display', serif",
    fontSize: "1.5rem",
    fontWeight: 700,
    color: "var(--wl-text)",
    marginBottom: "0.5rem",
  },
  subtitle: {
    fontSize: "0.875rem",
    color: "var(--wl-text-muted)",
    marginBottom: "1.5rem",
  },
  input: {
    width: "100%",
    padding: "0.75rem 1rem",
    borderRadius: 10,
    border: "1px solid var(--wl-border)",
    fontSize: "1rem",
    marginBottom: "1rem",
    boxSizing: "border-box" as const,
  },
  button: {
    width: "100%",
    padding: "0.875rem",
    borderRadius: 10,
    border: "none",
    fontSize: "1rem",
    fontWeight: 600,
    cursor: "pointer",
    background: "var(--wl-accent)",
    color: "var(--wl-text-on-accent)",
    marginTop: "0.5rem",
  },
  link: {
    color: "var(--wl-accent)",
    textDecoration: "none",
    fontSize: "0.875rem",
    marginTop: "1rem",
    display: "inline-block",
  },
  error: {
    fontSize: "0.875rem",
    color: "var(--wl-error)",
    marginBottom: "1rem",
  },
};

function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/profile";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setLoading(false);
    if (signInError) {
      setError(getAuthErrorMessage(signInError.message));
      return;
    }
    router.push(callbackUrl);
    router.refresh();
  }

  return (
    <div style={styles.card}>
      <h1 style={styles.title}>Sign in</h1>
      <p style={styles.subtitle}>Welcome back to Wavelength.</p>
      <form onSubmit={handleSubmit}>
        {error && <p style={styles.error}>{error}</p>}
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={styles.input}
          autoComplete="email"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={styles.input}
          autoComplete="current-password"
        />
        <button type="submit" style={styles.button} disabled={loading}>
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>
      <Link href="/signup" style={styles.link}>
        Don&apos;t have an account? Sign up
      </Link>
    </div>
  );
}

export default function SignInPage() {
  return (
    <div style={styles.page}>
      <link
        href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap"
        rel="stylesheet"
      />
      <div style={styles.topImage} aria-hidden />
      <div style={styles.content}>
        <Suspense fallback={<div style={styles.content}>Loading…</div>}>
          <SignInForm />
        </Suspense>
      </div>
    </div>
  );
}
