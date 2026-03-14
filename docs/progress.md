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
- [ ] Optional: starfield / globe (design direction)

---

## 3. Profile setup

- [ ] Profile/onboarding route
- [ ] Groq LLaMA 3.3 70B drill-down: multi-level interests (e.g. Anime → Attack on Titan)
- [ ] Save profile → backend; Groq 20D cultural vector; index in Elasticsearch

---

## 4. Elasticsearch

- [ ] Elastic Cloud (or local) setup
- [ ] Index: user_profiles (dense_vector 20D, geo_point, metadata)
- [ ] kNN + geo_distance query for nearby + compatibility
- [ ] ILM for auto-expiring data

---

## 5. Discover map

- [ ] Leaflet map, light/stylised base layer
- [ ] Your position: single glowing dot (anon, no exact location)
- [ ] Heart markers for nearby people; darker = higher match
- [ ] Red arc lines from you to each heart
- [ ] Labels: “X% wavelength”
- [ ] Left panel: “Find your people nearby.”, live count, quote
- [ ] Compatibility range slider (e.g. 40–95%), “Show Matches” button
- [ ] Click heart → profile popup: compatibility %, shared interests, Connect/Chat button

---

## 6. Geolocation & real-time

- [ ] navigator.geolocation (getCurrentPosition / watch), anonymised coords
- [ ] Backend: nearby query within 2 km, no exact location exposed
- [ ] Socket.io: client sends location + UUID; server pushes match updates

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

*Last updated: after adding full landing page (LandingScreen component).*
