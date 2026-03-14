"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  );
}
