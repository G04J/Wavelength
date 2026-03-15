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

// receives: userId, sectionData (interests), and name
// vectorises interests into 20 dimensional cultural taste vector
// saves vector, interests and name to ElasticSearch using upsert
app.post("/api/profile", async (req, res) => {
  const { userId, sectionData, name } = req.body
  try {
    const vector = await vectoriseInterests(sectionData)
    const allInterests = [
      ...sectionData.music,
      ...sectionData.tv,
      ...sectionData.games,
      ...sectionData.interests,
    ]
    await esClient.update({
      index: "users",
      id: userId,
      refresh: "wait_for",
      retry_on_conflict: 3,
      script: {
        source: "ctx._source.vector = params.vector; ctx._source.updatedAt = params.updatedAt; ctx._source.interests = params.interests; ctx._source.name = params.name;",
        params: { vector, updatedAt: new Date().toISOString(), interests: allInterests, name }
      },
      upsert: { userId, vector, name, interests: allInterests, updatedAt: new Date().toISOString() }
    })
    res.json({ ok: true })
  } catch (err) {
    console.error("[Backend] vector save error", err)
    res.status(500).json({ error: "Failed to save vector" })
  }
})

app.post("/api/signout", async (req, res) => {
  const { userId } = req.body
  try {
    await esClient.delete({ index: "users", id: userId })
    res.json({ ok: true })
  } catch (err) {
    res.json({ ok: true })
  }
})

const io = new Server(httpServer, {
  cors: { origin: process.env.FRONTEND_ORIGIN ?? "http://localhost:3000" },
});

const lastPositionBySocket = new Map<string, { lat: number; lng: number }>();

io.on("connection", (socket) => {
  console.log("[Backend] Socket connected:", socket.id)

  socket.on("register", (payload: { userId: string }) => {
    if (!payload?.userId) return
    socket.data.userId = payload.userId
  })

  // listens for location events, fired every time the user's GPS updates
  socket.on("location", async (data: { lat: number | string; lng: number | string; userId: string }) => {
    const lat = parseFloat(String(data?.lat))
    const lng = parseFloat(String(data?.lng))

    if (!isNaN(lat) && !isNaN(lng) && data.userId) {
      lastPositionBySocket.set(socket.id, { lat, lng })

      // fetch vector via docvalue_fields
      const vectorDoc = await esClient.search({
        index: "users",
        query: { term: { userId: data.userId } },
        docvalue_fields: [{ field: "vector" }],
        _source: false,
        size: 1,
      }).catch(() => null)

      // fetch interests separately from _source
      const sourceDoc = await esClient.search({
        index: "users",
        query: { term: { userId: data.userId } },
        _source: ["interests"],
        size: 1,
      }).catch(() => null)

      const hit = vectorDoc?.hits?.hits?.[0]
      const existingVector = (hit?.fields as any)?.vector?.[0] ?? null
      const myInterests: string[] = (sourceDoc?.hits?.hits?.[0]?._source as any)?.interests ?? []

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
        .map(hit => {
          const source = hit._source as any
          const theirInterests: string[] = source.interests ?? []
          const sharedInterests = theirInterests.filter(i => myInterests.includes(i))
          return {
            ...source,
            similarity: hit._score,
            sharedInterests,
          }
        })

      console.log("[Backend] nearby users found:", nearbyUsers.map((u: any) => ({ id: u.userId, name: u.name, similarity: u.similarity, sharedInterests: u.sharedInterests })))
      socket.emit("nearby_users", nearbyUsers)
    }
  })

  socket.on("disconnect", () => {
    const userId = socket.data.userId as string | undefined
    if (userId) {
      esClient.delete({ index: "users", id: userId }).catch(() => {})
    }
    lastPositionBySocket.delete(socket.id)
    console.log("[Backend] Socket disconnected:", socket.id)
  })
})

const PORT = process.env.PORT ?? 3001;

async function start() {
  await createUsersIndex()
  httpServer.listen(PORT, () => {
    console.log(`[Backend] Listening on http://localhost:${PORT}`)
  })
}

start()