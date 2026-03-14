"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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

export default function SignUpPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    setLoading(true);
    const supabase = createClient();
    const { error: signUpError } = await supabase.auth.signUp({ email, password });
    setLoading(false);
    if (signUpError) {
      setError(getAuthErrorMessage(signUpError.message));
      return;
    }
    router.push("/profile");
    router.refresh();
  }

  return (
    <div style={styles.page}>
      <link
        href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap"
        rel="stylesheet"
      />
      <div style={styles.topImage} aria-hidden />
      <div style={styles.content}>
        <div style={styles.card}>
          <h1 style={styles.title}>Create account</h1>
          <p style={styles.subtitle}>Join Wavelength — find your people nearby.</p>
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
              autoComplete="new-password"
            />
            <input
              type="password"
              placeholder="Confirm password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              style={styles.input}
              autoComplete="new-password"
            />
            <button type="submit" style={styles.button} disabled={loading}>
              {loading ? "Signing up…" : "Sign up"}
            </button>
          </form>
          <Link href="/signin" style={styles.link}>
            Already have an account? Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
