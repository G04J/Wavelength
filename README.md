# Wavelength

Find your people nearby. Anonymous compatibility between people in the same physical space — mutual interest only.

## Repo structure

- **frontend/** — Next.js (React, TypeScript, Tailwind, Framer Motion, Leaflet). Deploy to Vercel.
- **backend/** — Express + Socket.io. Deploy to Railway.

## Setup

### Frontend

```bash
cd frontend
cp .env.example .env.local   # edit with your values
npm install
npm run dev
```

Runs at [http://localhost:3000](http://localhost:3000).

### Backend

```bash
cd backend
cp .env.example .env         # edit with your values
npm install
npm run dev
```

Runs at [http://localhost:3001](http://localhost:3001). WebSocket on same host.

## Env

See `frontend/.env.example` and `backend/.env.example` for required variables (Elasticsearch, Groq, etc.).

## License

Private.
