import Groq from "groq-sdk"

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

export async function vectoriseInterests(interests: {
  music: string[]
  tv: string[]
  games: string[]
  interests: string[]
}): Promise<number[]> {
  const allTags = [
    ...interests.music,
    ...interests.tv,
    ...interests.games,
    ...interests.interests,
  ].sort()

  if (allTags.length === 0) return new Array(20).fill(0)

  const response = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [{
      role: "user",
      content: `You are a cultural taste embedding model. Given a person's interests, generate a 20-dimensional vector that captures their cultural taste profile.

Their interests: ${allTags.join(", ")}

The 20 dimensions represent (in order):
1. mainstream vs indie
2. visual vs audio
3. narrative vs aesthetic
4. fast-paced vs slow/contemplative
5. classic vs contemporary
6. western vs eastern
7. lighthearted vs dark/serious
8. social vs solitary
9. fantasy vs realism
10. emotional vs intellectual
11. music intensity (soft to heavy)
12. gaming preference (casual to hardcore)
13. film/tv preference (blockbuster to arthouse)
14. literary vs visual storytelling
15. urban vs nature themes
16. nostalgic vs futuristic
17. abstract vs concrete
18. collaborative vs competitive
19. minimalist vs maximalist
20. cynical vs optimistic

Return ONLY a JSON array of 20 floats between -1 and 1. No explanation, no markdown. Example: [0.2, -0.5, 0.8, ...]`,
    }],
    max_tokens: 200,
    temperature: 0,
  })

  const text = response.choices[0].message.content?.trim() ?? ""
  try {
    const parsed = JSON.parse(text)
    if (Array.isArray(parsed) && parsed.length === 20) return parsed
    throw new Error("invalid vector")
  } catch {
    const match = text.match(/\[[\d\s.,\-]+\]/)
    if (match) return JSON.parse(match[0])
    return new Array(20).fill(0)
  }
}