import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import { requireAuth } from "./middleware/auth.js";
import { createUsersIndex } from "./lib/elasticsearch.js"
import { esClient } from "./lib/elasticsearch.js"
import { vectoriseInterests } from "./lib/vectorise.js"
import "dotenv/config"

const app = express();
const httpServer = createServer(app);

app.use(cors({ origin: process.env.FRONTEND_ORIGIN ?? "http://localhost:3000" }));
app.use(express.json());

app.use((req, _res, next) => {
  console.log(`[Backend] ${req.method} ${req.path}`);
  next();
});

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.get("/api/me", requireAuth, (req, res) => {
  console.log("[Backend] GET /api/me ok", { userId: req.userId });
  res.json({ userId: req.userId, email: req.email ?? null });
});

// receives: userId and sectionData (interests)
// vectorises interests into 20 dimensional cultural taste vector
// saves vector to ElasticSearch using upsert
app.post("/api/profile", async (req, res) => {
  const { userId, sectionData } = req.body
  try {
    const vector = await vectoriseInterests(sectionData)
    await esClient.update({
      index: "users",
      id: userId,
      refresh: "wait_for",
      script: {
        source: "ctx._source.vector = params.vector; ctx._source.updatedAt = params.updatedAt;",
        params: { vector, updatedAt: new Date().toISOString() }
      },
      upsert: { userId, vector, updatedAt: new Date().toISOString() }
    })
    res.json({ ok: true })
  } catch (err) {
    console.error("[Backend] vector save error", err)
    res.status(500).json({ error: "Failed to save vector" })
  }
})

const io = new Server(httpServer, {
  cors: { origin: process.env.FRONTEND_ORIGIN ?? "http://localhost:3000" },
});


// map socketId -> last position
/** Last known position per socket (for nearby queries; anonymised, no exact exposure). */
const lastPositionBySocket = new Map<string, { lat: number; lng: number }>();

io.on("connection", (socket) => {
  console.log("[Backend] Socket connected:", socket.id)

  // ── location + kNN matching ───────────────────────────────────────────────
 
  // listens for location events, fired every time the user's GPS updates
  socket.on("location", async (data: { lat: number | string; lng: number | string; userId: string }) => {
    const lat = parseFloat(String(data?.lat))
    const lng = parseFloat(String(data?.lng))
 
    if (!isNaN(lat) && !isNaN(lng) && data.userId) {
      lastPositionBySocket.set(socket.id, { lat, lng })
 
      const existingDoc = await esClient.search({
        index: "users",
        query: { term: { userId: data.userId } },
        docvalue_fields: [{ field: "vector" }],
        _source: false,
        size: 1,
      }).catch(() => null)
 
      const hit = existingDoc?.hits?.hits?.[0]
      const existingVector = (hit?.fields as any)?.vector?.[0] ?? null
 
      if (!existingVector) {
        console.log("[Backend] no vector yet for", data.userId)
        return
      }
 
      await esClient.update({
        index: "users",
        id: data.userId,
        retry_on_conflict: 3,
        doc: {
          location: { lat, lon: lng },
          updatedAt: new Date().toISOString(),
        }
      })
 
      const nearby = await esClient.search({
        index: "users",
        knn: {
          field: "vector",
          query_vector: existingVector,
          k: 10,
          num_candidates: 50,
          filter: {
            geo_distance: {
              distance: "2km",
              location: { lat, lon: lng },
            },
          },
        },
      })
 
      const nearbyUsers = nearby.hits.hits
        .filter(hit => hit._id !== data.userId)
        .map(hit => ({
          ...(hit._source as any),
          similarity: hit._score,
        }))
 
      console.log("[Backend] nearby users found:", nearbyUsers.map((u: any) => ({ id: u.userId, similarity: u.similarity })))
      socket.emit("nearby_users", nearbyUsers)
    }
  })

  socket.on("disconnect", () => {
    lastPositionBySocket.delete(socket.id)
    console.log("[Backend] Socket disconnected:", socket.id)
  })
})

const PORT = process.env.PORT ?? 3001;

async function start() {
  await createUsersIndex()
  httpServer.listen(PORT, () => {
    console.log("[Backend] Listening on http://localhost:" + PORT)
  })
}

start()


