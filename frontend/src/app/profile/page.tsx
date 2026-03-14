"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
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
    color: "#3a1a1a",
    marginBottom: "0.375rem",
  },
  input: {
    width: "100%",
    padding: "0.75rem 1rem",
    borderRadius: 10,
    border: "1px solid #f0e0dc",
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
    background: "#e06060",
    color: "white",
  },
  buttonSecondary: {
    background: "#f5e6e6",
    color: "#b06060",
  },
  backLink: {
    display: "inline-block",
    fontSize: "0.875rem",
    color: "#e06060",
    marginBottom: "1rem",
    cursor: "pointer",
    background: "none",
    border: "none",
    padding: 0,
    fontFamily: "inherit",
  },
  error: {
    fontSize: "0.875rem",
    color: "#c04040",
    marginTop: "0.5rem",
  },
  success: {
    fontSize: "0.875rem",
    color: "#2d7a2d",
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
    color: "#b08080",
    marginBottom: "0.125rem",
  },
  profileValue: {
    fontSize: "0.95rem",
    color: "#3a1a1a",
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
    color: "#3a1a1a",
  },
  interestTags: {
    display: "flex",
    flexWrap: "wrap" as const,
    gap: "0.5rem",
  },
  interestTag: {
    padding: "0.3rem 0.75rem",
    borderRadius: 999,
    background: "rgba(224, 96, 96, 0.08)",
    color: "#5a3a3a",
    fontSize: "0.8rem",
  },
  interestEmpty: {
    fontSize: "0.8rem",
    color: "#b08080",
    fontStyle: "italic",
  },
  buttonRow: {
    display: "flex",
    flexWrap: "wrap" as const,
    gap: "0.75rem",
    marginTop: "1.25rem",
  },
};

export default function ProfilePage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [email, setEmail] = useState("");
  const [sectionData, setSectionData] = useState<SectionData>(() => createDefaultSectionData());
  const [mode, setMode] = useState<ProfileMode>("setup-basics");
  const [initialProfile, setInitialProfile] = useState<{ name: string; age: string; email: string } | null>(
    null
  );
  const [initialSectionData, setInitialSectionData] = useState<SectionData>(() => createDefaultSectionData());
  const [step1Error, setStep1Error] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

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
      .select("name, age, email")
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
      setName(nextName);
      setAge(nextAge);
      setEmail(nextEmail);
      setInitialProfile({ name: nextName, age: nextAge, email: nextEmail });
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
        <nav style={styles.nav}>
          <Link href="/" style={{ ...styles.link, fontWeight: 600 }}>
            wave~length
          </Link>
        </nav>
        <div style={styles.card}>
          <p style={styles.subtitle}>Loading profile…</p>
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
        <nav style={styles.nav}>
          <Link href="/" style={{ ...styles.link, fontWeight: 600 }}>
            wave~length
          </Link>
        </nav>
        <div style={styles.card}>
          <p style={styles.subtitle}>You’re not signed in.</p>
          <Link href="/signin" style={styles.link}>
            Sign in
          </Link>
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
        <div style={styles.profileHeader}>
          <h1 style={styles.title}>Profile</h1>
          {mode === "setup-basics" && (
            <p style={styles.subtitle}>
              Start with the basics. You can add interests next.
            </p>
          )}
          {mode === "setup-interests" && (
            <p style={styles.subtitle}>
              Add interests by category. Type and press Enter or click Add; suggestions may appear when available.
            </p>
          )}
          {mode === "display" && (
            <p style={styles.subtitle}>This is how you appear on Wavelength.</p>
          )}
          {mode === "edit-basics" && (
            <p style={styles.subtitle}>Update your basic details. Changes save for your profile.</p>
          )}
          {mode === "edit-interests" && (
            <p style={styles.subtitle}>Tweak your interests by category. Add or remove anything that no longer fits.</p>
          )}
        </div>

        {error && <p style={styles.error}>{error}</p>}
        {success && <p style={styles.success}>Profile saved.</p>}

        {(mode === "setup-basics" || mode === "edit-basics") && (
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
        )}

        {(mode === "setup-interests" || mode === "edit-interests") && (
          <>
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
                {INTEREST_SECTIONS.map((section) => (
                  <SearchSection
                    key={section.id}
                    section={section}
                    selected={sectionData[section.id as InterestSectionId] ?? []}
                    onChange={(items) => handleSectionChange(section.id as InterestSectionId, items)}
                  />
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
          </>
        )}

        {mode === "display" && (
          <>
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
                      <div style={styles.interestEmpty}>No {section.label.toLowerCase()} added yet.</div>
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
          </>
        )}
      </div>
    </div>
  );
}
