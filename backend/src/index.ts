import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import { requireAuth } from "./middleware/auth.js";

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
  console.log("[Backend] Socket connected:", socket.id);
  socket.on("location", (data: { lat: number; lng: number }) => {
    if (typeof data?.lat === "number" && typeof data?.lng === "number") {
      lastPositionBySocket.set(socket.id, { lat: data.lat, lng: data.lng });
      console.log("[Backend] Location update", { socketId: socket.id, lat: data.lat.toFixed(4), lng: data.lng.toFixed(4) });
    }
  });
  socket.on("disconnect", () => {
    lastPositionBySocket.delete(socket.id);
    console.log("[Backend] Socket disconnected:", socket.id);
  });
});

const PORT = process.env.PORT ?? 3001;
httpServer.listen(PORT, () => {
  console.log("[Backend] Listening on http://localhost:" + PORT);
});
