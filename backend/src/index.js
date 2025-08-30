import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import path from "path";

import { connectDB } from "./lib/db.js";
import authRoutes from "./routes/auth.route.js";
import messageRoutes from "./routes/message.route.js";
import { app, server } from "./lib/socket.js"; // using socket server

dotenv.config();

const PORT = process.env.PORT || 5000; // fallback for local dev
const __dirname = path.resolve();

// ---------------------- Middlewares ----------------------
app.use(express.json());
app.use(cookieParser());

// ✅ CORS: only allow defined origins
const allowedOrigins = [
  "http://localhost:5173", // local frontend
  process.env.CLIENT_URL,  // production frontend (from .env)
].filter(Boolean);

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

// ---------------------- API Routes ----------------------
app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);

// ---------------------- Serve Frontend in Production ----------------------
if (process.env.NODE_ENV === "production") {
  const frontendPath = path.join(__dirname, "../frontend/dist");
  app.use(express.static(frontendPath));

  app.get("*", (req, res) => {
    res.sendFile(path.join(frontendPath, "index.html"));
  });
}

// ---------------------- Start Server ----------------------
server.listen(PORT, () => {
  console.log(`✅ Server is running on PORT: ${PORT}`);
  connectDB();
});
