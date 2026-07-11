import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

import path from "path";

import { connectDB } from "./lib/db.js";

import authRoutes from "./routes/auth.route.js";
import messageRoutes from "./routes/message.route.js";
import conversationRoutes from "./routes/conversation.route.js";
import callRoutes from "./routes/call.route.js";
import aiRoutes from "./routes/ai.route.js";
import { app, server } from "./lib/socket.js";
import { errorHandler } from "./middleware/error.middleware.js";

dotenv.config();

const PORT = process.env.PORT;
const __dirname = path.resolve();

app.use(express.json({ limit: "15mb" }));
app.use(cookieParser());
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        // libsodium-wrappers (E2EE) compiles a WebAssembly module at runtime,
        // which needs 'wasm-unsafe-eval' — helmet's default script-src blocks it.
        scriptSrc: ["'self'", "'wasm-unsafe-eval'"],
        // Profile pictures and message media are hosted on Cloudinary, not same-origin.
        imgSrc: ["'self'", "data:", "https://res.cloudinary.com"],
        mediaSrc: ["'self'", "https://res.cloudinary.com"],
      },
    },
  })
);
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  })
);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
  message: "Too many requests from this IP, please try again after 15 minutes",
});

app.use("/api/auth/login", authLimiter);
app.use("/api/auth/signup", authLimiter);
app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/conversations", conversationRoutes);
app.use("/api/calls", callRoutes);
app.use("/api/ai", aiRoutes);

if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../frontend/dist")));

  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend", "dist", "index.html"));
  });
}

app.use(errorHandler);

server.listen(PORT, () => {
  console.log("server is running on PORT:" + PORT);
  connectDB();
});
