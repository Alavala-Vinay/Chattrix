import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import path from "path";

import { connectDB } from "./lib/db.js";
import authRoutes from "./routes/auth.route.js";
import messageRoutes from "./routes/message.route.js";
import { app, server } from "./lib/socket.js"; // socket-enabled app + server

dotenv.config();

const PORT = process.env.PORT || 5000;
const __dirname = path.resolve();

// ---------------------- Middlewares ----------------------
app.use(express.json());
app.use(cookieParser());
app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:5173",
  credentials: true,
}));


// ✅ CORS: allow local + production frontend
const allowedOrigins = [
  "http://localhost:5173",              // local dev frontend
  "https://chattrix-front.vercel.app",  // deployed frontend on Vercel
  process.env.CLIENT_URL,               // fallback from .env
].filter(Boolean);

app.use(
  cors({
    origin: function (origin, callback) {
      // allow requests with no origin (like mobile apps or curl)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      } else {
        console.warn("❌ Blocked by CORS:", origin);
        return callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// ✅ Explicitly handle preflight requests
app.options("*", cors());

// ---------------------- Test Route ----------------------
app.get("/", (req, res) => {
  res.json({ message: "Hello from Chattrix backend ✅" });
});

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
