# Wavelength
Find your people nearby. Anonymous compatibility between people in the same physical space, mutual interest only.

---

## The idea

You're surrounded by people every day. On the train, in a lecture, at a cafe. Some of them love the same music, the same shows, the same games as you. You just have no way of knowing who.

Wavelength shows you. You build a taste profile, and we show you who nearby shares your wavelength, completely anonymously. You only appear to each other when the feeling is mutual. No names, no photos, no awkward cold approaches. Just people who get it.

---

## Features

- **Map view** with heart markers for nearby people. Darker heart = stronger compatibility. Red strings connect you to each match.
- **Compatibility score** based on cultural taste, not demographics.
- **Shared interests** shown on each match card.
- **Anonymous by default.** You are never revealed unless both people choose to connect.
- **Real time.** Matches update live as people move around you.
- **Auto-disappear.** You are removed from the map when you sign out.

---

## How to run

**Frontend**
```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev
```
Goes to [http://localhost:3000](http://localhost:3000)

**Backend**
```bash
cd backend
npm install
cp .env.example .env
npm run dev
```
Goes to [http://localhost:3001](http://localhost:3001)

Open two terminals and run each in its own folder.

---

## Environment variables

**Frontend** `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_WS_URL=
NEXT_PUBLIC_BACKEND_URL=
```

**Backend** `.env`:
```
SUPABASE_JWT_SECRET=
ELASTICSEARCH_URL=
ELASTICSEARCH_API_KEY=
GROQ_API_KEY=
PORT=3001
FRONTEND_ORIGIN=http://localhost:3000
```

Never commit real secrets.

---

## How it works under the hood

When you save your profile, Groq LLaMA 3.3 70B converts your interests into a 20-dimensional cultural taste vector. This vector is stored in Elasticsearch as a `dense_vector` field.

When you open the map, your GPS coordinates are sent to the backend via Socket.io. The backend runs a hybrid kNN + geo query in Elasticsearch, finding your most culturally similar people within 2km, and delivers the results to your map in real time.

Shared interests are computed by comparing your interest tags against each nearby user's tags directly in the backend before emitting results.

---

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | Next.js, TypeScript, Tailwind CSS, Framer Motion, Leaflet.js |
| Backend | Node.js, Express, Socket.io |
| AI | Groq LLaMA 3.3 70B |
| Search | Elasticsearch on Elastic Cloud |
| Auth + DB | Supabase |

---

## License
Private.
