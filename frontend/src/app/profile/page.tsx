"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/utils/supabase/client";
import type { SectionData, InterestSectionId } from "@/types/database";
import { SearchSection } from "@/components/profile/SearchSection";
import type { InterestSection } from "@/components/profile/SearchSection";

type ProfileMode =
  | "setup-basics"
  | "setup-interests"
  | "display"
  | "edit-basics"
  | "edit-interests";

const INTEREST_SECTIONS: InterestSection[] = [
  { id: "music", label: "Music", placeholder: "search artists, albums, genres…" },
  { id: "tv", label: "TV & Film", placeholder: "search shows, movies, directors…" },
  { id: "games", label: "Video Games", placeholder: "search games, studios, genres…" },
  { id: "interests", label: "Interests", placeholder: "search hobbies, topics, anything…" },
];

function createDefaultSectionData(): SectionData {
  return {
    music: [],
    tv: [],
    games: [],
    interests: [],
  };
}

const styles = {
  page: {
    minHeight: "100vh",
    backgroundImage: "url('/user-profile-bg.jpeg')",
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    padding: "2rem",
    position: "relative" as const,
    overflow: "visible",
  },
  nav: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "1.25rem",
    flexWrap: "wrap" as const,
    gap: "0.75rem",
    padding: "0.35rem 1rem",
    borderRadius: 999,
    border: "1px solid var(--wl-border-subtle)",
    background: "var(--wl-bg-nav)",
    backdropFilter: "blur(10px)",
    position: "relative" as const,
    zIndex: 2,
    overflow: "visible",
  },
  title: {
    fontFamily: "'Playfair Display', serif",
    fontSize: "1.5rem",
    fontWeight: 700,
    color: "var(--wl-text)",
  },
  cardWrap: {
    display: "flex",
    justifyContent: "center",
    marginTop: "1.5rem",
    position: "relative" as const,
    zIndex: 2,
  },
  card: {
    width: "100%",
    maxWidth: 640,
    background: "#ffffff",
    borderRadius: 20,
    boxShadow: "0 16px 60px var(--wl-accent-shadow-strong)",
    padding: "2.25rem 2rem 2rem",
    border: "1px solid var(--wl-border)",
    position: "relative" as const,
    overflow: "hidden",
  },
  subtitle: {
    fontSize: "0.875rem",
    color: "var(--wl-text-muted)",
    marginTop: "0.5rem",
  },
  link: {
    color: "var(--wl-accent)",
    textDecoration: "none",
    fontSize: "0.875rem",
    fontWeight: 500,
  },
  signOut: {
    padding: "0.5rem 1rem",
    borderRadius: 8,
    border: "1px solid var(--wl-border)",
    background: "var(--wl-bg-card)",
    color: "var(--wl-text-muted)",
    fontSize: "0.875rem",
    cursor: "pointer",
    fontFamily: "inherit",
  },
  form: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "1.25rem",
    marginTop: "1.5rem",
  },
  label: {
    display: "block",
    fontSize: "0.875rem",
    fontWeight: 600,
    color: "var(--wl-text)",
    marginBottom: "0.375rem",
  },
  input: {
    width: "100%",
    padding: "0.75rem 1rem",
    borderRadius: 10,
    border: "1px solid var(--wl-border)",
    fontSize: "1rem",
    boxSizing: "border-box" as const,
  },
  button: {
    padding: "0.625rem 1.25rem",
    borderRadius: 10,
    border: "none",
    fontSize: "0.875rem",
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "inherit",
  },
  buttonPrimary: {
    background: "var(--wl-accent)",
    color: "var(--wl-text-on-accent)",
  },
  buttonSecondary: {
    background: "var(--wl-accent-soft)",
    color: "#7a4545",
  },
  backLink: {
    display: "inline-block",
    fontSize: "0.875rem",
    color: "var(--wl-accent)",
    marginBottom: "1rem",
    cursor: "pointer",
    background: "none",
    border: "none",
    padding: 0,
    fontFamily: "inherit",
  },
  error: {
    fontSize: "0.875rem",
    color: "var(--wl-error)",
    marginTop: "0.5rem",
  },
  success: {
    fontSize: "0.875rem",
    color: "var(--wl-success)",
    marginTop: "0.5rem",
  },
  profileHeader: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "0.25rem",
    marginBottom: "1.25rem",
  },
  profileRow: {
    marginBottom: "0.75rem",
  },
  profileLabel: {
    fontSize: "0.75rem",
    fontWeight: 600,
    textTransform: "uppercase" as const,
    letterSpacing: "0.06em",
    color: "var(--wl-text-muted)",
    marginBottom: "0.125rem",
  },
  profileValue: {
    fontSize: "0.95rem",
    color: "var(--wl-text)",
  },
  interestGroup: {
    marginTop: "1rem",
  },
  interestGroupHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "0.5rem",
    marginBottom: "0.5rem",
  },
  interestGroupTitle: {
    fontSize: "0.9rem",
    fontWeight: 600,
    color: "var(--wl-text)",
  },
  interestTags: {
    display: "flex",
    flexWrap: "wrap" as const,
    gap: "0.5rem",
  },
  interestTag: {
    padding: "0.3rem 0.75rem",
    borderRadius: 999,
    background: "var(--wl-bg-tag)",
    color: "#5a3a3a",
    fontSize: "0.8rem",
  },
  interestEmpty: {
    fontSize: "0.8rem",
    color: "var(--wl-text-muted)",
    fontStyle: "italic",
  },
  buttonRow: {
    display: "flex",
    flexWrap: "wrap" as const,
    gap: "0.75rem",
    marginTop: "1.25rem",
  },
  stepper: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "0.75rem",
    marginBottom: "1.5rem",
    fontSize: "0.75rem",
    color: "var(--wl-text-muted)",
  },
  pill: {
    padding: "0.25rem 0.7rem",
    borderRadius: 999,
    background: "rgba(255,255,255,0.75)",
    border: "1px solid var(--wl-border)",
    fontSize: "0.72rem",
    fontWeight: 600,
    textTransform: "uppercase" as const,
    letterSpacing: "0.12em",
    color: "var(--wl-accent-light)",
  },
  stepperTrack: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "0.75rem",
  },
  stepDot: {
    width: 9,
    height: 9,
    borderRadius: "50%",
    background: "var(--wl-bg-tag-strong)",
  },
  stepDotActive: {
    background: "var(--wl-accent)",
    boxShadow: "0 0 0 6px var(--wl-accent-glow)",
  },
  stepLabel: {
    fontSize: "0.75rem",
    fontWeight: 600,
    color: "var(--wl-text-muted)",
  },
  backgroundBlob: {
    position: "absolute" as const,
    borderRadius: "50%",
    filter: "blur(60px)",
    opacity: 0.25,
    pointerEvents: "none" as const,
    zIndex: 1,
  },
  interestDropdown: {
    borderRadius: 12,
    border: "1px solid var(--wl-border)",
    background: "rgba(255,255,255,0.88)",
    padding: "0.35rem 0.85rem 0.7rem",
    marginBottom: "0.75rem",
  },
  interestDropdownSummary: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "0.5rem",
    listStyle: "none",
    cursor: "pointer",
  },
  interestDropdownTitle: {
    fontSize: "0.88rem",
    fontWeight: 600,
    color: "#4a2727",
  },
  interestDropdownHint: {
    fontSize: "0.78rem",
    color: "var(--wl-text-muted)",
  },
};

export default function ProfilePage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [email, setEmail] = useState("");
  const [sectionData, setSectionData] = useState<SectionData>(() => createDefaultSectionData());
  const [mode, setMode] = useState<ProfileMode>("setup-basics");
  const [initialProfile, setInitialProfile] = useState<{
    name: string;
    age: string;
    email: string;
    facebook_url: string;
    instagram_handle: string;
    show_social_to_nearby: boolean;
  } | null>(null);
  const [facebookUrl, setFacebookUrl] = useState("");
  const [instagramHandle, setInstagramHandle] = useState("");
  const [showSocialToNearby, setShowSocialToNearby] = useState(false);
  const [initialSectionData, setInitialSectionData] = useState<SectionData>(() => createDefaultSectionData());
  const [step1Error, setStep1Error] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const currentStep =
    mode === "setup-basics" || mode === "edit-basics"
      ? 1
      : mode === "setup-interests" || mode === "edit-interests"
      ? 2
      : 0;

  const loadProfile = useCallback(async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }
    setUserId(user.id);
    setEmail(user.email ?? "");

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("name, age, email, facebook_url, instagram_handle, show_social_to_nearby")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) {
      console.error("[Profile] fetch profile error", profileError);
      setError(profileError.message);
      setLoading(false);
      return;
    }
    if (profile) {
      const nextName = profile.name ?? "";
      const nextAge = profile.age != null ? String(profile.age) : "";
      const nextEmail = profile.email ?? user.email ?? "";
      const nextFb = (profile as { facebook_url?: string | null }).facebook_url ?? "";
      const nextIg = (profile as { instagram_handle?: string | null }).instagram_handle ?? "";
      const nextShow = (profile as { show_social_to_nearby?: boolean }).show_social_to_nearby ?? false;
      setName(nextName);
      setAge(nextAge);
      setEmail(nextEmail);
      setFacebookUrl(nextFb);
      setInstagramHandle(nextIg);
      setShowSocialToNearby(nextShow);
      setInitialProfile({
        name: nextName,
        age: nextAge,
        email: nextEmail,
        facebook_url: nextFb,
        instagram_handle: nextIg,
        show_social_to_nearby: nextShow,
      });
    }

    const { data: interestRows, error: interestsError } = await supabase
      .from("user_interests")
      .select("interest, category")
      .eq("user_id", user.id);

    if (interestsError) {
      console.error("[Profile] fetch interests error", interestsError);
    } else if (interestRows?.length) {
      const grouped = createDefaultSectionData();
      for (const r of interestRows) {
        const cat = (r.category ?? "interests") as InterestSectionId;
        if (cat in grouped) {
          grouped[cat].push(r.interest);
        } else {
          grouped.interests.push(r.interest);
        }
      }
      setSectionData(grouped);
      setInitialSectionData(grouped);
    }

    const hasAnyProfile =
      !!profile ||
      !!(interestRows && interestRows.length > 0);

    setMode(hasAnyProfile ? "display" : "setup-basics");
    setLoading(false);
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const handleSectionChange = useCallback((sectionId: InterestSectionId, items: string[]) => {
    setSectionData((prev) => ({ ...prev, [sectionId]: items }));
  }, []);

  function validateStep1(): boolean {
    const nameTrim = name.trim();
    const emailTrim = email.trim();
    const ageStr = age.trim();
    const ageNum = ageStr ? parseInt(ageStr, 10) : null;

    if (!nameTrim) {
      setStep1Error("Name is required.");
      return false;
    }
    if (!emailTrim) {
      setStep1Error("Email is required.");
      return false;
    }
    if (ageNum != null && (isNaN(ageNum) || ageNum < 18)) {
      setStep1Error("Age must be 18 or older if provided.");
      return false;
    }
    setStep1Error(null);
    return true;
  }

  function handleContinueToInterests() {
    if (!validateStep1()) return;
    setMode("setup-interests");
  }

  async function saveProfile() {
    if (!userId) return;
    setError(null);
    setSuccess(false);
    setSaving(true);

    const nameTrim = name.trim();
    const emailTrim = email.trim();
    const ageStr = age.trim();
    const ageNum = ageStr ? parseInt(ageStr, 10) : null;

    if (!nameTrim) {
      setError("Name is required.");
      setSaving(false);
      return;
    }
    if (!emailTrim) {
      setError("Email is required.");
      setSaving(false);
      return;
    }
    if (ageNum != null && (isNaN(ageNum) || ageNum < 18)) {
      setError("Age must be 18 or older.");
      setSaving(false);
      return;
    }

    const payload = {
      name: nameTrim,
      email: emailTrim,
      age: ageNum ?? null,
      facebook_url: facebookUrl.trim() || null,
      instagram_handle: instagramHandle.trim() || null,
      show_social_to_nearby: showSocialToNearby,
      sectionData: {
        music: sectionData.music ?? [],
        tv: sectionData.tv ?? [],
        games: sectionData.games ?? [],
        interests: sectionData.interests ?? [],
      },
    };

    const res = await fetch("/api/profile/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      setError((data as { error?: string }).error ?? "Failed to save profile");
      setSaving(false);
      return;
    }

    setError(null);
    setSuccess(true);
    setSaving(false);
    setInitialProfile({
      name: nameTrim,
      age: ageNum != null ? String(ageNum) : "",
      email: emailTrim,
      facebook_url: facebookUrl.trim(),
      instagram_handle: instagramHandle.trim(),
      show_social_to_nearby: showSocialToNearby,
    });
    setInitialSectionData({
      music: sectionData.music ?? [],
      tv: sectionData.tv ?? [],
      games: sectionData.games ?? [],
      interests: sectionData.interests ?? [],
    });
    setMode("display");
    loadProfile();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await saveProfile();
  }

  async function handleSaveBasics() {
    if (!validateStep1()) return;
    await saveProfile();
  }

  function handleCancelEditBasics() {
    if (initialProfile) {
      setName(initialProfile.name);
      setAge(initialProfile.age);
      setEmail(initialProfile.email);
      setFacebookUrl(initialProfile.facebook_url ?? "");
      setInstagramHandle(initialProfile.instagram_handle ?? "");
      setShowSocialToNearby(initialProfile.show_social_to_nearby ?? false);
    }
    setError(null);
    setStep1Error(null);
    setMode("display");
  }

  function handleCancelEditInterests() {
    setSectionData(initialSectionData);
    setError(null);
    setMode("display");
  }

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  if (loading) {
    return (
      <div style={styles.page}>
        <link
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <div
          style={{
            ...styles.backgroundBlob,
            width: 320,
            height: 320,
            top: -80,
            right: -60,
            background: "#f9d0d0",
          }}
        />
        <div
          style={{
            ...styles.backgroundBlob,
            width: 260,
            height: 260,
            top: "45%",
            left: -80,
            background: "#fce0c8",
          }}
        />

        <nav style={styles.nav}>
          <Link href="/" style={{ display: "inline-flex", alignItems: "center" }}>
            <img
              src="/logo.png"
              alt="Wavelength"
              style={{ height: 48, width: "auto", display: "block", verticalAlign: "middle" }}
            />
          </Link>
        </nav>
        <div style={styles.cardWrap}>
          <motion.div
            style={styles.card}
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <p style={styles.subtitle}>Loading profile…</p>
          </motion.div>
        </div>
      </div>
    );
  }

  if (!userId) {
    return (
      <div style={styles.page}>
        <link
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <div
          style={{
            ...styles.backgroundBlob,
            width: 320,
            height: 320,
            top: -80,
            right: -60,
            background: "#f9d0d0",
          }}
        />
        <div
          style={{
            ...styles.backgroundBlob,
            width: 260,
            height: 260,
            top: "45%",
            left: -80,
            background: "#fce0c8",
          }}
        />

        <nav style={styles.nav}>
          <Link href="/" style={{ display: "inline-flex", alignItems: "center" }}>
            <img
              src="/logo.png"
              alt="Wavelength"
              style={{ height: 48, width: "auto", display: "block", verticalAlign: "middle" }}
            />
          </Link>
        </nav>
        <div style={styles.cardWrap}>
          <motion.div
            style={styles.card}
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <p style={styles.subtitle}>You’re not signed in.</p>
            <div style={{ marginTop: "1rem" }}>
              <Link href="/signin" style={styles.link}>
                Sign in
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <link
        href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap"
        rel="stylesheet"
      />

      <div
        style={{
          ...styles.backgroundBlob,
          width: 320,
          height: 320,
          top: -80,
          right: -60,
          background: "#f9d0d0",
        }}
      />
      <div
        style={{
          ...styles.backgroundBlob,
          width: 260,
          height: 260,
          top: "45%",
          left: -80,
          background: "#fce0c8",
        }}
      />
      <div
        style={{
          ...styles.backgroundBlob,
          width: 200,
          height: 200,
          bottom: "14%",
          right: "10%",
          background: "#f5c8e0",
        }}
      />

      <nav style={styles.nav}>
        <Link href="/" style={{ display: "inline-flex", alignItems: "center" }}>
          <img
            src="/logo.png"
            alt="Wavelength"
            style={{ height: 48, width: "auto", display: "block", verticalAlign: "middle" }}
          />
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <Link href="/map" style={styles.link}>
            discover
          </Link>
          <button type="button" onClick={handleSignOut} style={styles.signOut}>
            Sign out
          </button>
        </div>
      </nav>

      <div style={styles.cardWrap}>
        <motion.div
          style={styles.card}
          initial={{ opacity: 0, y: 16, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.35 }}
        >
          <div style={styles.profileHeader}>
            <h1 style={styles.title}>Profile</h1>

            <div style={styles.stepper}>
              <span style={styles.pill}>
                {currentStep === 0 ? "profile" : `step ${currentStep} of 2`}
              </span>
              <div style={styles.stepperTrack}>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <div
                      style={{
                        ...styles.stepDot,
                        ...(mode === "setup-basics" ||
                        mode === "edit-basics" ||
                        mode === "display"
                          ? styles.stepDotActive
                          : {}),
                      }}
                    />
                    <span style={styles.stepLabel}>Basics</span>
                  </div>
                </div>
                <div style={{ height: 1, flex: 1, background: "var(--wl-accent-glow)" }} />
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <div
                      style={{
                        ...styles.stepDot,
                        ...(mode === "setup-interests" ||
                        mode === "edit-interests" ||
                        mode === "display"
                          ? styles.stepDotActive
                          : {}),
                      }}
                    />
                    <span style={styles.stepLabel}>Interests</span>
                  </div>
                </div>
              </div>
            </div>

            {mode === "setup-basics" && (
              <p style={styles.subtitle}>
                Start with the basics so your matches feel human. You can always adjust these later.
              </p>
            )}
            {mode === "setup-interests" && (
              <p style={styles.subtitle}>
                Add interests by category. Type and press Enter or click Add; suggestions may appear
                when available.
              </p>
            )}
            {mode === "display" && (
              <p style={styles.subtitle}>This is how you appear on Wavelength right now.</p>
            )}
            {mode === "edit-basics" && (
              <p style={styles.subtitle}>Update your basic details. Keep things simple and honest.</p>
            )}
            {mode === "edit-interests" && (
              <p style={styles.subtitle}>
                Tweak your interests by category. Add what energises you; remove what no longer fits.
              </p>
            )}
          </div>

          {error && <p style={styles.error}>{error}</p>}
          {success && <p style={styles.success}>Profile saved.</p>}

          <AnimatePresence mode="wait">
            {(mode === "setup-basics" || mode === "edit-basics") && (
              <motion.div
                key={mode}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18 }}
              >
                <div style={styles.form}>
                  <div>
                    <label htmlFor="name" style={styles.label}>
                      Name
                    </label>
                    <input
                      id="name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      placeholder="Your name"
                      style={styles.input}
                      autoComplete="name"
                    />
                  </div>
                  <div>
                    <label htmlFor="age" style={styles.label}>
                      Age (18+)
                    </label>
                    <input
                      id="age"
                      type="number"
                      min={18}
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      placeholder="e.g. 25"
                      style={styles.input}
                    />
                  </div>
                  <div>
                    <label htmlFor="email" style={styles.label}>
                      Email
                    </label>
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder="you@example.com"
                      style={styles.input}
                      autoComplete="email"
                    />
                  </div>
                  <div>
                    <label htmlFor="facebook_url" style={styles.label}>
                      Facebook (profile URL or page name)
                    </label>
                    <input
                      id="facebook_url"
                      type="text"
                      value={facebookUrl}
                      onChange={(e) => setFacebookUrl(e.target.value)}
                      placeholder="https://facebook.com/yourpage or your page name"
                      style={styles.input}
                    />
                  </div>
                  <div>
                    <label htmlFor="instagram_handle" style={styles.label}>
                      Instagram (username)
                    </label>
                    <input
                      id="instagram_handle"
                      type="text"
                      value={instagramHandle}
                      onChange={(e) => setInstagramHandle(e.target.value)}
                      placeholder="username without @"
                      style={styles.input}
                    />
                  </div>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                    <input
                      id="show_social_to_nearby"
                      type="checkbox"
                      checked={showSocialToNearby}
                      onChange={(e) => setShowSocialToNearby(e.target.checked)}
                      style={{ marginTop: 4 }}
                    />
                    <label htmlFor="show_social_to_nearby" style={{ ...styles.label, marginBottom: 0, fontWeight: 500 }}>
                      Show my social links to people who find me on the map
                    </label>
                  </div>
                  {step1Error && <p style={styles.error}>{step1Error}</p>}

                  {mode === "setup-basics" && (
                    <button
                      type="button"
                      onClick={handleContinueToInterests}
                      style={{ ...styles.button, ...styles.buttonPrimary }}
                    >
                      Continue to interests →
                    </button>
                  )}

                  {mode === "edit-basics" && (
                    <div style={styles.buttonRow}>
                      <button
                        type="button"
                        onClick={handleSaveBasics}
                        style={{ ...styles.button, ...styles.buttonPrimary }}
                        disabled={saving}
                      >
                        {saving ? "Saving…" : "Save basics"}
                      </button>
                      <button
                        type="button"
                        onClick={handleCancelEditBasics}
                        style={{ ...styles.button, ...styles.buttonSecondary }}
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {(mode === "setup-interests" || mode === "edit-interests") && (
              <motion.div
                key={mode}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18 }}
              >
                {mode === "setup-interests" && (
                  <button
                    type="button"
                    onClick={() => setMode("setup-basics")}
                    style={styles.backLink}
                  >
                    ← Back to name, age, email
                  </button>
                )}

                <form onSubmit={handleSubmit} style={styles.form}>
                  <div>
                    <label style={styles.label}>Interests</label>
                    {INTEREST_SECTIONS.map((section, idx) => (
                      <details
                        key={section.id}
                        style={styles.interestDropdown}
                        open={idx === 0}
                      >
                        <summary style={styles.interestDropdownSummary}>
                          <span style={styles.interestDropdownTitle}>{section.label}</span>
                          <span style={styles.interestDropdownHint}>
                            {sectionData[section.id as InterestSectionId]?.length
                              ? `${sectionData[section.id as InterestSectionId]!.length} added`
                              : "click to add"}
                          </span>
                        </summary>
                        <SearchSection
                          section={section}
                          selected={sectionData[section.id as InterestSectionId] ?? []}
                          onChange={(items) =>
                            handleSectionChange(section.id as InterestSectionId, items)
                          }
                          hideLabel
                        />
                      </details>
                    ))}
                  </div>

                  <div style={styles.buttonRow}>
                    <button
                      type="submit"
                      style={{ ...styles.button, ...styles.buttonPrimary }}
                      disabled={saving}
                    >
                      {saving ? "Saving…" : "Save profile"}
                    </button>
                    {mode === "edit-interests" && (
                      <button
                        type="button"
                        onClick={handleCancelEditInterests}
                        style={{ ...styles.button, ...styles.buttonSecondary }}
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </form>
              </motion.div>
            )}

            {mode === "display" && (
              <motion.div
                key={mode}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18 }}
              >
                <div>
                  <div style={styles.profileRow}>
                    <div style={styles.profileLabel}>Name</div>
                    <div style={styles.profileValue}>{name || "—"}</div>
                  </div>
                  <div style={styles.profileRow}>
                    <div style={styles.profileLabel}>Age</div>
                    <div style={styles.profileValue}>{age || "—"}</div>
                  </div>
                  <div style={styles.profileRow}>
                    <div style={styles.profileLabel}>Email</div>
                    <div style={styles.profileValue}>{email || "—"}</div>
                  </div>
                  <div style={styles.profileRow}>
                    <div style={styles.profileLabel}>Facebook</div>
                    <div style={styles.profileValue}>{facebookUrl ? (facebookUrl.startsWith("http") ? facebookUrl : `https://facebook.com/${facebookUrl}`) : "—"}</div>
                  </div>
                  <div style={styles.profileRow}>
                    <div style={styles.profileLabel}>Instagram</div>
                    <div style={styles.profileValue}>{instagramHandle ? `@${instagramHandle}` : "—"}</div>
                  </div>
                  <div style={styles.profileRow}>
                    <div style={styles.profileLabel}>Show social links on map</div>
                    <div style={styles.profileValue}>{showSocialToNearby ? "Yes" : "No"}</div>
                  </div>
                </div>

                <div>
                  {INTEREST_SECTIONS.map((section) => {
                    const items = sectionData[section.id as InterestSectionId] ?? [];
                    return (
                      <div key={section.id} style={styles.interestGroup}>
                        <div style={styles.interestGroupHeader}>
                          <span style={styles.interestGroupTitle}>{section.label}</span>
                        </div>
                        {items.length ? (
                          <div style={styles.interestTags}>
                            {items.map((item) => (
                              <span key={item} style={styles.interestTag}>
                                {item}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <div style={styles.interestEmpty}>
                            No {section.label.toLowerCase()} added yet.
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div style={styles.buttonRow}>
                  <button
                    type="button"
                    style={{ ...styles.button, ...styles.buttonPrimary }}
                    onClick={() => setMode("edit-basics")}
                  >
                    Edit basics
                  </button>
                  <button
                    type="button"
                    style={{ ...styles.button, ...styles.buttonSecondary }}
                    onClick={() => setMode("edit-interests")}
                  >
                    Edit interests
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
