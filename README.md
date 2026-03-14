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

Env files are only needed once you add Elasticsearch, Groq, etc. See `frontend/.env.example` and `backend/.env.example` for variables.

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
