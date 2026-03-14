import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import { requireAuth } from "./middleware/auth.js";
import { createUsersIndex } from "./lib/elasticsearch.js"
import { esClient } from "./lib/elasticsearch.js"
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

app.post("/api/profile", requireAuth, (req, res) => {
  console.log("[Backend] POST /api/profile ok", { userId: req.userId });
  res.status(200).json({ ok: true, message: "Profile placeholder" });
});

const io = new Server(httpServer, {
  cors: { origin: process.env.FRONTEND_ORIGIN ?? "http://localhost:3000" },
});

/** Last known position per socket (for nearby queries; anonymised, no exact exposure). */
const lastPositionBySocket = new Map<string, { lat: number; lng: number }>();

io.on("connection", (socket) => {
  console.log("[Backend] Socket connected:", socket.id)

  socket.on("location", async (data: { lat: number; lng: number; userId: string }) => {
    if (typeof data?.lat === "number" && typeof data?.lng === "number") {
      lastPositionBySocket.set(socket.id, { lat: data.lat, lng: data.lng })

      // upsert into Elasticsearch
      await esClient.index({
        index: "users",
        id: data.userId,
        document: {
          userId: data.userId,
          location: { lat: data.lat, lon: data.lng },
          updatedAt: new Date().toISOString(),
        },
      })

      // find everyone within 2km
      const nearby = await esClient.search({
        index: "users",
        query: {
          geo_distance: {
            distance: "2km",
            location: { lat: data.lat, lon: data.lng },
          },
        },
      })

      const nearbyUsers = nearby.hits.hits
        .filter(hit => hit._id !== data.userId)
        .map(hit => hit._source)

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


