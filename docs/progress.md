# Wavelength — Progress

Track implementation steps here. Update this file after every meaningful change.

---

## 1. Project scaffold

- [x] Frontend: Next.js (App Router), TypeScript, Tailwind, Framer Motion, Leaflet, Socket.io client
- [x] Backend: Express, Socket.io, TypeScript, ESM
- [x] Root: README, .gitignore, env examples
- [x] Repo pushed to GitHub (G04J/Wavelength)

---

## 2. Landing page

- [x] Pastel cream/white layout, Wavelength logo/branding
- [x] Hero section, nav (Discover, Connections, Profile)
- [x] Full landing screen: blobs, sine waves, “your people are closer than you think”, how-it-works cards, CTA → profile
- [x] Optional: map-themed background treatment (design direction)

---

## 2.5 Authentication (Supabase Auth)

- [x] Supabase project; Email + Google providers; JWT secret for backend
- [x] Frontend: @supabase/supabase-js, @supabase/ssr; browser + server clients
- [x] Sign-up page (email + password); sign-in page (email/password + Google)
- [x] Auth callback route for OAuth (`/auth/callback`)
- [x] Middleware: protect `/profile`, `/discover`, `/connections`; redirect to `/signin` with callbackUrl
- [x] Backend: JWT verification (SUPABASE_JWT_SECRET), `requireAuth` middleware, `GET /api/me`, `POST /api/profile` (placeholder)
- [x] Profile page placeholder; Next.js API proxy `/api/me` forwards token to Express
- [x] Env examples and README updated

---

## 3. Profile setup

- [x] Profile/onboarding route (gated by auth)
- [x] Profile form: name, age, email (Supabase `public.profiles`)
- [x] Dynamic interests: add/remove with optional category (Supabase `public.user_interests`)
- [x] Profile save via `POST /api/profile/save` (profiles + user_interests + user_embeddings); see `docs/supabase-rls.md` for RLS. Embeddings use Google Gemini (`gemini-embedding-001`, 1536 dims via outputDimensionality for pgvector ivfflat); profile save is not blocked if embedding fails.
- [x] Interest suggestions via `POST /api/profile/suggestions` (Groq, server-side); createDefaultSectionData() factory
- [x] Profile flow: first-time setup (step 1 = name, age, email → step 2 = interests + Save)
- [x] Returning-user profile UX: read-only display with separate Edit basics / Edit interests views
- [ ] Groq LLaMA 3.3 70B drill-down: multi-level interests (e.g. Anime → Attack on Titan)
- [ ] Save profile → backend; Groq 20D cultural vector; index in Elasticsearch (uses `userId` from Supabase JWT)

---

## 4. Elasticsearch

- [ ] Elastic Cloud (or local) setup
- [ ] Index: user_profiles (dense_vector 20D, geo_point, metadata)
- [ ] kNN + geo_distance query for nearby + compatibility
- [ ] ILM for auto-expiring data

---

## 5. Discover map

- [x] Google Maps JavaScript API: map + “You” marker for live position (optional; set `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`)
- [x] Leaflet map: light base layer, "You" teal dot at live position (or fallback center), 2 km ring
- [x] Your position: single glowing dot; map center and you marker use live position when available
- [x] Heart markers for nearby people (backend `nearby_users` only; no fallback list); darker = higher match
- [x] Red arc lines (threads) from you to each heart
  - *3D animated hearts (gradient, glow, heartbeat + float keyframes); red threads same thickness for all, in overlayPane so visible.*
- [x] Labels: “X% wavelength”
- [ ] Left panel: “Find your people nearby.”, live count, Matching radius 2 km
- [ ] Compatibility range slider (e.g. 40–95%), “Show Matches” button
- [x] Click heart → profile popup: compatibility %, shared interests, Connect/Chat button
- [x] “How it works” link from map → dedicated page (/how-it-works) with steps; cream/red theme, Plus Jakarta Sans

---

## 6. Geolocation & real-time

- [x] navigator.geolocation (watchPosition) via LocationContext + useLiveLocation; enable on Discover
- [x] Backend: Socket.io `location` event; index position in Elasticsearch; 2 km geo_distance query; emit `nearby_users` to client
- [x] Frontend: useLocationSocketSync streams live position to backend while on Discover (Supabase userId); MapsScreen also emits `location` on its socket (anon userId) and listens for `nearby_users`
- [x] Backend: nearby query within 2 km, no exact location exposed (hits return userId + location for map only)
- [x] Server pushes nearby_users to client; map shows only real nearby users (no dev fallback)

---

## 7. Mutual reveal & match

- [ ] “Connect” intent stored (backend)
- [ ] Web Crypto commit/reveal so server can’t infer who connected first
- [ ] On mutual A↔B: emit mutual_match, optional confetti / celebration

---

## 8. Privacy & polish

- [ ] Privacy toggle / invisible mode (exclude from nearby search)
- [ ] Anonymous identity: crypto.randomUUID()
- [ ] Loading states and error handling (geolocation denied, WS disconnect)

---

## 9. PWA & deploy

- [ ] PWA: manifest, service worker, icons
- [ ] Optional: install prompt on mobile
- [ ] Frontend → Vercel
- [ ] Backend → Railway

---

## Nice to have

- [ ] Messaging after mutual match
- [ ] Filters (gender, age range)
- [ ] Compatibility % count-up animation

---

*Last updated: Removed 7 fallback users; map shows only real nearby users from backend.*
