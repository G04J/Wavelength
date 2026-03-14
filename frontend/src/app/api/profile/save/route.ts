import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { getEmbedding, EMBEDDING_MODEL } from "@/lib/embeddings";

const ALLOWED_SECTION_KEYS = ["music", "tv", "games", "interests"] as const;
type SectionKey = (typeof ALLOWED_SECTION_KEYS)[number];

type SectionData = {
  music: string[];
  tv: string[];
  games: string[];
  interests: string[];
};

type Body = {
  name?: unknown;
  age?: unknown;
  email?: unknown;
  sectionData?: unknown;
};

/**
 * Validate and sanitize sectionData from request body.
 * Only allowed keys; each value must be an array of strings; trim and dedupe per category.
 */
function validateAndSanitizeSectionData(raw: unknown): SectionData {
  const out: SectionData = {
    music: [],
    tv: [],
    games: [],
    interests: [],
  };

  if (raw == null || typeof raw !== "object") return out;

  for (const key of ALLOWED_SECTION_KEYS) {
    const val = (raw as Record<string, unknown>)[key];
    if (!Array.isArray(val)) continue;
    const strings = val
      .map((x) => (typeof x === "string" ? x.trim() : ""))
      .filter(Boolean);
    out[key] = strings.filter((s, i) => strings.indexOf(s) === i);
  }

  return out;
}

/**
 * Build stable, deduped list of all tags and profile text for embedding.
 * Order: music, tv, games, interests. Joins with ", ".
 */
function buildAllTagsAndProfileText(sectionData: SectionData): { allTags: string[]; profileText: string } {
  const allTags = [
    ...sectionData.music,
    ...sectionData.tv,
    ...sectionData.games,
    ...sectionData.interests,
  ]
    .map((x) => x.trim())
    .filter(Boolean);

  const deduped = allTags.filter((s, i) => allTags.indexOf(s) === i);
  const profileText = deduped.join(", ");
  return { allTags: deduped, profileText };
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Auth: use only session user id; never trust user_id from body
  const userId = session.user.id;

  let body: Body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim() : "";
  let age: number | null = null;
  if (body.age != null && body.age !== "") {
    const n = Number(body.age);
    if (!Number.isInteger(n) || n < 18) {
      return NextResponse.json({ error: "Age must be 18 or older if provided" }, { status: 400 });
    }
    age = n;
  }

  if (!name) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }
  if (!email) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  const safeSectionData = validateAndSanitizeSectionData(body.sectionData);
  const { allTags, profileText } = buildAllTagsAndProfileText(safeSectionData);

  // 1) Upsert profiles
  const { error: profileError } = await supabase.from("profiles").upsert(
    {
      id: userId,
      name,
      email,
      age,
    },
    { onConflict: "id" }
  );

  if (profileError) {
    console.error("[API profile/save] profiles upsert error:", profileError);
    return NextResponse.json({ error: "Failed to save profile. Please try again." }, { status: 500 });
  }

  // 2) Replace user_interests: delete existing, then insert current
  const { error: deleteInterestsError } = await supabase
    .from("user_interests")
    .delete()
    .eq("user_id", userId);

  if (deleteInterestsError) {
    console.error("[API profile/save] user_interests delete error:", deleteInterestsError);
    return NextResponse.json({ error: "Failed to save profile. Please try again." }, { status: 500 });
  }

  const interestRows = [
    ...safeSectionData.music.map((interest) => ({ user_id: userId, interest, category: "music" })),
    ...safeSectionData.tv.map((interest) => ({ user_id: userId, interest, category: "tv" })),
    ...safeSectionData.games.map((interest) => ({ user_id: userId, interest, category: "games" })),
    ...safeSectionData.interests.map((interest) => ({ user_id: userId, interest, category: "interests" })),
  ];

  if (interestRows.length > 0) {
    const { error: insertInterestsError } = await supabase.from("user_interests").insert(interestRows);
    if (insertInterestsError) {
      console.error("[API profile/save] user_interests insert error:", insertInterestsError);
      return NextResponse.json({ error: "Failed to save profile. Please try again." }, { status: 500 });
    }
  }

  // 3) user_embeddings: upsert when we have tags (non-blocking), delete when none
  if (allTags.length > 0) {
    try {
      const embedding = await getEmbedding(profileText);
      const { error: embeddingError } = await supabase.from("user_embeddings").upsert(
        {
          user_id: userId,
          profile_text: profileText,
          embedding,
          model_name: EMBEDDING_MODEL,
        },
        { onConflict: "user_id" }
      );
      if (embeddingError) {
        console.error("[API profile/save] user_embeddings upsert error:", embeddingError);
      }
    } catch (err) {
      console.error("[API profile/save] embedding generation failed (profile saved):", err);
    }
  } else {
    const { error: deleteEmbedError } = await supabase
      .from("user_embeddings")
      .delete()
      .eq("user_id", userId);

    if (deleteEmbedError) {
      console.error("[API profile/save] user_embeddings delete error:", deleteEmbedError);
      return NextResponse.json({ error: "Failed to save profile. Please try again." }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true });
}
