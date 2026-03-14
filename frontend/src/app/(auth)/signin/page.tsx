"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { getAuthErrorMessage } from "@/utils/authErrors";

const styles = {
  page: {
    minHeight: "100vh",
    background: "#fdf8f6",
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    justifyContent: "center",
    padding: "2rem",
  },
  card: {
    width: "100%",
    maxWidth: 400,
    background: "white",
    borderRadius: 16,
    boxShadow: "0 4px 24px rgba(224, 96, 96, 0.08)",
    padding: "2rem",
    border: "1px solid #f0e0dc",
  },
  title: {
    fontFamily: "'Playfair Display', serif",
    fontSize: "1.5rem",
    fontWeight: 700,
    color: "#3a1a1a",
    marginBottom: "0.5rem",
  },
  subtitle: {
    fontSize: "0.875rem",
    color: "#b08080",
    marginBottom: "1.5rem",
  },
  input: {
    width: "100%",
    padding: "0.75rem 1rem",
    borderRadius: 10,
    border: "1px solid #f0e0dc",
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
    background: "#e06060",
    color: "white",
    marginTop: "0.5rem",
  },
  link: {
    color: "#e06060",
    textDecoration: "none",
    fontSize: "0.875rem",
    marginTop: "1rem",
    display: "inline-block",
  },
  error: {
    fontSize: "0.875rem",
    color: "#c04040",
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
      <Suspense fallback={<div style={styles.page}>Loading…</div>}>
        <SignInForm />
      </Suspense>
    </div>
  );
}
