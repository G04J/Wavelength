# Wavelength

Find your people nearby. Anonymous compatibility between people in the same physical space — mutual interest only.

---

## Setup (one-time)

**Frontend**

```bash
cd frontend
npm install
cp .env.example .env.local   # optional: edit with your values
```

**Backend**

```bash
cd backend
npm install
cp .env.example .env         # optional: edit with your values
```

**Auth (Supabase):** Create a project at [supabase.com](https://supabase.com). In Authentication → Providers enable Email and Google (add Google OAuth credentials from Google Cloud Console). Then:

- **Frontend** `.env.local`: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_WS_URL` (backend URL for API/WS).
- **Backend** `.env`: `SUPABASE_JWT_SECRET` (Project Settings → API → JWT Secret), `PORT`, `FRONTEND_ORIGIN`.

Copy from each `.env.example`; never commit real secrets. Other vars (Elasticsearch, Groq) are needed when you add those features.

---

## Run

**Frontend** (landing + app):

```bash
cd frontend
npm run dev
```

→ [http://localhost:3000](http://localhost:3000)

**Backend** (API + WebSocket):

```bash
cd backend
npm run dev
```

→ [http://localhost:3001](http://localhost:3001)

To run both: open two terminals and run each `npm run dev` in its folder.

---

## Repo structure

- **frontend/** — Next.js (React, TypeScript, Tailwind, Framer Motion, Leaflet). Deploy to Vercel.
- **backend/** — Express + Socket.io. Deploy to Railway.

## License

Private.
