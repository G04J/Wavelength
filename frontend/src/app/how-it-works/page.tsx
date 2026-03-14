"use client";

import Link from "next/link";

const steps = [
  {
    num: "01",
    title: "pick your interests",
    body: "AI generates personalised options just for you. Two levels deep. No generic tags.",
  },
  {
    num: "02",
    title: "see who's nearby",
    body: "Match cards appear in real time. You see a compatibility score and shared interests. Nothing else.",
  },
  {
    num: "03",
    title: "mutual tap to connect",
    body: "Tap connect on someone. If they tap back — match fires. If not, nobody ever knows.",
  },
];

const technicalCards = [
  {
    title: "Semantic compatibility engine",
    body: "Interest profiles are embedded through the Groq API and compared using cosine similarity, so related taste clusters score naturally higher than unrelated ones.",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 12h2c1 0 2-1 3-2s2 0 3 2 2 1 3 2 2 0 3-2 2-1 3-2h2" />
        <path d="M2 8h2c1 0 2 1 3 2s2 0 3-2 2-1 3-2 2 0 3 2 2 1 3 2h2" />
        <path d="M2 16h2c1 0 2 1 3 2s2 0 3-2 2-1 3-2 2 0 3 2 2 1 3 2h2" />
      </svg>
    ),
  },
  {
    title: "AI-powered interest mapping",
    body: "An LLM dynamically expands each user's interests in real time. Pick Anime and get options like Attack on Titan and Demon Slayer. Pick Music and get sub-genres and artists.",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 15 9 22 9 17 14 18 22 12 18 6 22 7 14 2 9 9 9" />
      </svg>
    ),
  },
  {
    title: "Real-time presence layer",
    body: "Firestore onSnapshot listeners push nearby matches to all devices the moment someone joins, creating a live multi-user experience with sub-second updates.",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="2" />
        <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
      </svg>
    ),
  },
];

export default function HowItWorksPage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#fdf8f6",
        fontFamily: "'Plus Jakarta Sans', sans-serif",
      }}
    >
      <link
        href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap"
        rel="stylesheet"
      />

      {/* nav */}
      <nav
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "1rem 1.5rem",
          borderBottom: "1px solid rgba(220,180,180,0.25)",
          background: "rgba(253,248,246,0.92)",
          backdropFilter: "blur(8px)",
        }}
      >
        <Link
          href="/"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            textDecoration: "none",
            color: "#c05858",
            fontWeight: 700,
            fontSize: 15,
          }}
        >
          <svg width="20" height="14" viewBox="0 0 20 14">
            <polyline
              points="0,7 3,2 6,12 9,4 12,10 15,7 18,7"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          wavelength
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <Link
            href="/map"
            style={{
              fontSize: 13,
              color: "#C0392B",
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            ← Back to map
          </Link>
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: "50%",
              background: "#F5B8B0",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 13,
              fontWeight: 700,
              color: "#C0392B",
            }}
          >
            A
          </div>
        </div>
      </nav>

      {/* content */}
      <div style={{ padding: "2.5rem 1.5rem 3rem", maxWidth: 900, margin: "0 auto" }}>
        <p
          style={{
            fontSize: 11,
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            color: "#C0392B",
            fontWeight: 600,
            marginBottom: 12,
          }}
        >
          How it works
        </p>
        <h1
          style={{
            fontSize: "clamp(1.75rem, 4vw, 2.25rem)",
            fontWeight: 700,
            color: "#3a1a1a",
            lineHeight: 1.2,
            marginBottom: 16,
          }}
        >
          A safer way to discover who already feels like your people.
        </h1>
        <p
          style={{
            fontSize: 15,
            color: "#b08080",
            lineHeight: 1.7,
            marginBottom: 40,
          }}
        >
          Wavelength turns a room into a live social graph. Nearby people appear as
          compatibility signals, not as invasive profiles. Connect only when it’s mutual.
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: 20,
          }}
        >
          {steps.map((step) => (
            <div
              key={step.num}
              style={{
                background: "#ffffff",
                borderRadius: 20,
                padding: "1.5rem 1.5rem 1.75rem",
                border: "1px solid rgba(220,180,180,0.3)",
                boxShadow: "0 2px 20px rgba(0,0,0,0.06)",
                position: "relative",
                overflow: "hidden",
              }}
            >
              <span
                style={{
                  position: "absolute",
                  top: 12,
                  right: 16,
                  fontSize: 28,
                  fontWeight: 700,
                  color: "rgba(192,57,43,0.12)",
                  lineHeight: 1,
                }}
              >
                {step.num}
              </span>
              <p
                style={{
                  fontSize: 11,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: "#C0392B",
                  fontWeight: 600,
                  marginBottom: 8,
                }}
              >
                Step {step.num}
              </p>
              <h2
                style={{
                  fontSize: 17,
                  fontWeight: 700,
                  color: "#3a1a1a",
                  lineHeight: 1.25,
                  marginBottom: 10,
                }}
              >
                {step.title}
              </h2>
              <p
                style={{
                  fontSize: 14,
                  color: "#666",
                  lineHeight: 1.65,
                }}
              >
                {step.body}
              </p>
            </div>
          ))}
        </div>

        {/* Serious engineering / Technical complexity */}
        <p
          style={{
            fontSize: 11,
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            color: "#C0392B",
            fontWeight: 600,
            marginTop: 56,
            marginBottom: 12,
          }}
        >
          Technical complexity
        </p>
        <h2
          style={{
            fontSize: "clamp(1.5rem, 3.5vw, 2rem)",
            fontWeight: 700,
            color: "#3a1a1a",
            lineHeight: 1.2,
            marginBottom: 12,
          }}
        >
          Serious engineering beneath a soft, human interface.
        </h2>
        <p
          style={{
            fontSize: 15,
            color: "#b08080",
            lineHeight: 1.7,
            marginBottom: 28,
          }}
        >
          The product feels effortless because the architecture handles semantic reasoning,
          live synchronization, spatial discovery, and interaction polish underneath the surface.
        </p>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: 20,
          }}
        >
          {technicalCards.map((card) => (
            <div
              key={card.title}
              style={{
                background: "#ffffff",
                borderRadius: 20,
                padding: "1.5rem 1.5rem 1.75rem",
                border: "1px solid rgba(220,180,180,0.3)",
                boxShadow: "0 2px 20px rgba(0,0,0,0.06)",
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  background: "rgba(192,57,43,0.08)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#C0392B",
                  marginBottom: 14,
                }}
              >
                {card.icon}
              </div>
              <h3
                style={{
                  fontSize: 16,
                  fontWeight: 700,
                  color: "#3a1a1a",
                  lineHeight: 1.25,
                  marginBottom: 10,
                }}
              >
                {card.title}
              </h3>
              <p
                style={{
                  fontSize: 14,
                  color: "#666",
                  lineHeight: 1.65,
                }}
              >
                {card.body}
              </p>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 48, textAlign: "center" }}>
          <Link
            href="/map"
            style={{
              display: "inline-block",
              background: "#C0392B",
              color: "#fff",
              border: "none",
              borderRadius: 999,
              padding: "12px 28px",
              fontSize: 14,
              fontWeight: 600,
              textDecoration: "none",
              boxShadow: "0 4px 20px rgba(192,57,43,0.25)",
            }}
          >
            Back to map →
          </Link>
        </div>
      </div>
    </div>
  );
}
