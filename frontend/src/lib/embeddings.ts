import { GoogleGenAI } from "@google/genai";

function getClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set");
  }
  return new GoogleGenAI({ apiKey });
}

/** Output dimension for Gemini embeddings. Must match Supabase column: embedding vector(1536). pgvector ivfflat supports up to 2000 dims. */
export const EMBEDDING_DIMENSION = 1536;

export const EMBEDDING_MODEL = "gemini-embedding-001";

/**
 * Generate an embedding vector for the given text. Server-side only.
 * Uses Google Gemini gemini-embedding-001 with outputDimensionality 1536 so the vector fits pgvector ivfflat (max 2000 dims). Supabase user_embeddings.embedding must be vector(1536).
 */
export async function getEmbedding(text: string): Promise<number[]> {
  const ai = getClient();
  const input = text.trim() || " ";
  const response = await ai.models.embedContent({
    model: EMBEDDING_MODEL,
    contents: input,
    config: { outputDimensionality: EMBEDDING_DIMENSION },
  });

  const embedding = response.embeddings?.[0]?.values;
  if (!embedding) {
    throw new Error("No embedding returned from Gemini API");
  }
  return embedding;
}
