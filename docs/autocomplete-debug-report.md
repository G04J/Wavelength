# Autocomplete Debug Report

## A. Root causes found

1. **Frontend never checked `res.ok`**  
   Non-200 responses (503 when GROQ_API_KEY missing, 500 on Groq errors) were treated as success. The client always called `res.json()` and used `data.suggestions` (often `undefined` on error bodies), so it got `[]` and had no way to know the request failed.

2. **API returned 200 with empty suggestions when GROQ_API_KEY was missing**  
   The route did `if (!process.env.GROQ_API_KEY) return NextResponse.json({ suggestions: [] })` with status 200. So “key missing” was indistinguishable from “no results,” and the UI had nothing to show.

3. **Dropdown hid whenever suggestions were empty**  
   The condition was `open && (loading || suggestions.length > 0)`. So when the API returned `[]` (missing key or error), the dropdown closed immediately. Users saw no “Searching…” state or any error—it looked like nothing happened.

4. **No visible error state**  
   Errors were effectively swallowed: no `res.ok` check, no error state in the component, and no message when the API failed. So “autocomplete not working” was correct: the UI never showed failure or empty-result feedback.

5. **Two-character minimum with no hint**  
   `MIN_QUERY_LENGTH = 2` is correct, but the UI didn’t say so. Typing one character does nothing (no request), which can look like a broken feature.

6. **Which server handles the route**  
   `/api/profile/suggestions` and `/api/profile/save` are **Next.js API routes** (App Router). They run in the **Next.js dev server (localhost:3000)**, not in the Express backend (localhost:3001). Logs and errors from these routes appear in the **Next.js terminal**, not the Express one.

---

## B. Evidence

### 1. Frontend not checking `res.ok`

**File:** `frontend/src/components/profile/SearchSection.tsx` (original)

```ts
const res = await fetch("/api/profile/suggestions", { ... });
const data = await res.json().catch(() => ({}));
const list = Array.isArray((data as { suggestions?: string[] }).suggestions)
  ? (data as { suggestions: string[] }).suggestions
  : [];
return list;
```

- No `if (!res.ok)`.
- On 503/500, `data` is e.g. `{ error: "..." }`, so `data.suggestions` is `undefined`, and `list` becomes `[]`.

### 2. API returning 200 when key missing

**File:** `frontend/src/app/api/profile/suggestions/route.ts` (original)

```ts
if (!process.env.GROQ_API_KEY) {
  return NextResponse.json({ suggestions: [] });  // status 200 by default
}
```

- No status 503, so the frontend could not tell “not configured” from “no results.”

### 3. Dropdown condition

**File:** `frontend/src/components/profile/SearchSection.tsx` (original)

```tsx
{open && (loading || suggestions.length > 0) && (
  <div style={styles.dropdown}>
```

- When `loading` becomes false and `suggestions` is `[]`, the condition is false and the dropdown unmounts. No “no results” or error message.

### 4. Route location (Next.js, not Express)

- Next.js App Router serves `app/api/**/route.ts` under `/api/...`.
- `frontend/src/app/api/profile/suggestions/route.ts` exists → **Next.js** serves `POST /api/profile/suggestions` on the **Next** server (port 3000).
- Express in `backend/` has no `/api/profile/suggestions` handler → **Express (3001)** does not handle this.

---

## C. Fixes (summary)

| # | File | Fix |
|---|------|-----|
| 1 | `app/api/profile/suggestions/route.ts` | When `GROQ_API_KEY` is missing, return **503** with `{ error: "Suggestions not configured", suggestions: [] }` and log a warning. |
| 2 | `app/api/profile/suggestions/route.ts` | On Groq `catch`, return **500** with `{ error: "Suggestions temporarily unavailable", suggestions: [] }` (and keep `console.error`). |
| 3 | `SearchSection.tsx` | After `fetch`, **check `res.ok`**. If `!res.ok`, read `data.error`, set a `suggestionsError` state, and return `[]`. |
| 4 | `SearchSection.tsx` | Add **`suggestionsError`** state and show it in the dropdown (e.g. “Suggestions not configured” / “Suggestions temporarily unavailable”) so failures are visible. |
| 5 | `SearchSection.tsx` | Change dropdown visibility to **`open && (loading || suggestions.length > 0 || suggestionsError != null)`** so the dropdown stays open when there’s an error. |
| 6 | `SearchSection.tsx` | When there are no suggestions and no error, show a **“No suggestions. Try different words or add your own above.”** line in the dropdown. |
| 7 | `SearchSection.tsx` | Add hint: **“Type at least 2 characters for suggestions.”** so the 2-char minimum is clear. |
| 8 | (Optional) | Ensure **GROQ_API_KEY** is set in `frontend/.env.local` (no `NEXT_PUBLIC_`). Restart Next dev server after changing env. |

---

## D. Patched code

Fixes have been applied as follows.

### D1. `frontend/src/app/api/profile/suggestions/route.ts`

- **Missing key:** Return **503** and log:
  - `return NextResponse.json({ error: "Suggestions not configured", suggestions: [] }, { status: 503 });`
  - `console.warn("[API profile/suggestions] GROQ_API_KEY is not set; returning 503.");`
- **Groq error:** Return **500** and keep logging:
  - `return NextResponse.json({ error: "Suggestions temporarily unavailable", suggestions: [] }, { status: 500 });`
  - `console.error("[API profile/suggestions] Groq error:", err);`
- **400:** Response body includes `suggestions: []` for consistent parsing.

### D2. `frontend/src/components/profile/SearchSection.tsx`

- **`fetchSuggestions`:**
  - Call `setSuggestionsError(null)` at start.
  - After `res.json()`, **if `!res.ok`**: set `setSuggestionsError(msg)` (from `data.error` or fallback), `return []`.
  - Only use `data.suggestions` when `res.ok`.
- **State:** Added **`suggestionsError: string | null`**.
- **Dropdown visibility:** `showDropdown = open && (loading || suggestions.length > 0 || suggestionsError != null)`.
- **Dropdown content:**
  - If `loading`: show “Searching…”.
  - Else if `suggestionsError`: show `suggestionsError` in red.
  - Else if `suggestions.length === 0`: show “No suggestions. Try different words or add your own above.”
  - Else: list suggestions (click to add).
- **Hint text:** “Type at least 2 characters for suggestions. Press Enter or click Add to add your own.”
- **onFocus:** Open dropdown when `suggestionsError` is set so the error stays visible after focus.
- **addItem:** Clear `setSuggestionsError(null)` when adding an item.
- **Style:** Added `suggestionError` for the error line in the dropdown.
- **Lint:** `overflowY: "auto" as const` to satisfy the type checker.

---

## Save behavior (verified)

- **Interests** are held in React state (`sectionData`) only until the user clicks **“Save profile.”**
- **Persistence** happens only when **“Save profile”** is clicked, which calls **`POST /api/profile/save`** (Next.js route on 3000). That route updates **profiles**, replaces **user_interests**, and generates/upserts **user_embeddings**.
- So “nothing created in backend” before Save is **expected**.

---

## How to verify after patch

1. **Set `GROQ_API_KEY`** in `frontend/.env.local`, restart Next (`npm run dev` in frontend).
2. Open **Profile → step 2 (interests)**.
3. Type **at least 2 characters** (e.g. “olivia” in Music).
4. You should see either:
   - **“Searching…”** then a list of suggestions, or  
   - **“Suggestions not configured”** in the dropdown (503) if the key is missing, or  
   - **“Suggestions temporarily unavailable”** (500) if Groq fails.
5. Check the **Next.js terminal** (where `npm run dev` runs for the frontend) for:
   - `[API profile/suggestions] GROQ_API_KEY is not set` (503), or  
   - `[API profile/suggestions] Groq error:` (500).
6. In the browser **Network** tab, inspect the **POST /api/profile/suggestions** request: status 200 (success), 503 (key missing), or 500 (Groq error).

---

## Firebase vs current behavior (alignment)

| Firebase (old) | Next + Supabase (current, after fix) |
|----------------|--------------------------------------|
| Groq in client (`dangerouslyAllowBrowser`) | Groq only in **Next API route** (no key in client). |
| User types → debounce → fetch suggestions | Same: `handleInput` → 400ms debounce → `fetchSuggestions` → `POST /api/profile/suggestions`. |
| Dropdown with 6 suggestions | Same: API returns up to 6, parsed and deduped. |
| Click suggestion → add tag | Same: `onMouseDown` → `addItem(item)`. |
| Enter → add typed text | Same: `handleKeyDown` Enter → `addItem(query.trim())`. |
| Tags below, remove with × | Same. |
| Nothing persisted until submit | Same: only **“Save profile”** calls `/api/profile/save` and writes to Supabase. |

The only intentional difference is **2-character minimum** for the suggestions request (and the UI now explains this). If you need 1-character autocomplete, reduce `MIN_QUERY_LENGTH` to 1 in both the API route and the component (and update the hint text).
