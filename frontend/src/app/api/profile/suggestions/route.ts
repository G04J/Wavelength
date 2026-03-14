import { NextResponse } from "next/server";
import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY ?? "",
});

const MAX_SUGGESTIONS = 6;

/** Minimum query length before calling the model (avoids noisy single-char requests). */
const MIN_QUERY_LENGTH = 2;

const INTEREST_FALLBACKS = [
  "reading",
  "swimming",
  "hiking",
  "painting",
  "cooking",
  "baking",
  "journaling",
  "yoga",
  "pilates",
  "running",
  "photography",
  "gardening",
  "knitting",
  "crocheting",
  "dancing",
  "chess",
  "board games",
  "sketching",
  "writing",
  "travelling",
  "camping",
  "cycling",
  "gym",
  "meditation",
  "language learning",
];

/**
 * Defensively parse model output into a string array.
 * Ensures array, strings only, trim, no empty, dedupe, max 6.
 */
function parseSuggestions(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  const strings = raw
    .map((s) => (typeof s === "string" ? String(s).trim() : ""))
    .filter(Boolean);
  return [...new Set(strings)].slice(0, MAX_SUGGESTIONS);
}

function isObviousProperNoun(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return false;

  // Pure single-word Title Case, e.g. "Netflix", "Minecraft"
  if (/^[A-Z][a-z]+$/.test(trimmed)) return true;

  // Multi-word each in Title Case, e.g. "Taylor Swift", "Radiohead Live"
  if (/^([A-Z][a-z]+)(\s+[A-Z][a-z]+)+$/.test(trimmed)) return true;

  return false;
}

/**
 * Parse and sanitize suggestions specifically for the "Interests" category.
 * - Trim
 * - Drop obvious proper nouns
 * - Lowercase
 * - Dedupe
 * - Max 6
 */
function parseInterestSuggestions(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];

  const lowered: string[] = [];

  for (const item of raw) {
    if (typeof item !== "string") continue;
    const original = item.trim();
    if (!original) continue;
    if (isObviousProperNoun(original)) continue;
    lowered.push(original.toLowerCase());
  }

  return [...new Set(lowered)].slice(0, MAX_SUGGESTIONS);
}

function buildInterestFallback(query: string): string[] {
  const q = query.trim().toLowerCase();
  const source = q.length
    ? INTEREST_FALLBACKS.filter((item) => item.toLowerCase().includes(q))
    : INTEREST_FALLBACKS;

  const deduped = [...new Set(source.map((s) => s.toLowerCase()))];
  return deduped.slice(0, MAX_SUGGESTIONS);
}

export async function POST(request: Request) {
  if (!process.env.GROQ_API_KEY) {
    console.warn("[API profile/suggestions] GROQ_API_KEY is not set; returning 503.");
    return NextResponse.json(
      { error: "Suggestions not configured", suggestions: [] },
      { status: 503 }
    );
  }

  let body: { query?: unknown; category?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON", suggestions: [] }, { status: 400 });
  }

  const query = typeof body.query === "string" ? body.query.trim() : "";
  const category = typeof body.category === "string" ? body.category : "Interests";

  if (query.length < MIN_QUERY_LENGTH) {
    return NextResponse.json({ suggestions: [] });
  }

  try {
    const isInterestsCategory = category.toLowerCase() === "interests";
    const prompt = isInterestsCategory
      ? `Autocomplete the search query "${query}" in the category "Interests".
Return exactly ${MAX_SUGGESTIONS} suggestions that are activities, hobbies, or things a person can do.

Important rules:
- Suggestions must be activities or hobbies only.
- They must NOT be proper nouns.
- They must NOT be names of people, brands, artists, movies, TV shows, games, apps, or places.
- Prefer lowercase words or phrases.
- Prefer everyday activities and hobbies.
- Good examples include: reading, swimming, hiking, painting, cooking, journaling, yoga, gardening, baking, running, photography, playing chess.
- Bad examples include: Taylor Swift, Netflix, Minecraft, Sydney, Marvel, Radiohead.

Return ONLY a valid JSON array of ${MAX_SUGGESTIONS} strings.
Do not include markdown.
Do not include explanation.
Do not include numbering.`
      : `Autocomplete the search query "${query}" in the category "${category}". Return exactly ${MAX_SUGGESTIONS} real, specific suggestions (artist names, show titles, game titles, etc.) that start with or closely match what the user typed. Be specific, not generic.
Return ONLY a JSON array of strings, no markdown, no explanation. Example: ["result1","result2","result3","result4","result5","result6"]`;

    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      max_tokens: 120,
      temperature: 0.3,
    });

    const text = response.choices[0]?.message?.content?.trim() ?? "";
    let raw: unknown;
    try {
      raw = JSON.parse(text);
    } catch {
      const match = text.match(/\[[\s\S]*?\]/);
      raw = match ? JSON.parse(match[0]) : [];
    }

    let suggestions = isInterestsCategory ? parseInterestSuggestions(raw) : parseSuggestions(raw);

    if (isInterestsCategory && suggestions.length === 0) {
      suggestions = buildInterestFallback(query);
    }

    return NextResponse.json({ suggestions });
  } catch (err) {
    console.error("[API profile/suggestions] Groq error:", err);
    return NextResponse.json(
      { error: "Suggestions temporarily unavailable", suggestions: [] },
      { status: 500 }
    );
  }
}
