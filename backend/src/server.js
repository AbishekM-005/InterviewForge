import express from "express";
import cors from "cors";
import path from "path";
import { serve } from "inngest/express";
import ENV from "./lib/env.js";
import connectDB from "./lib/db.js";
import { inngest, functions } from "./lib/inngest.js";
import { clerkMiddleware } from "@clerk/express";
import chatRoutes from "./routes/chatRoutes.js";
import sessionRoutes from "./routes/sessionRoutes.js";

const app = express();

const __dirname = path.resolve();

const baseOrigins = (ENV.CLIENT_URL || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const devOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
];

const allowedOrigins =
  ENV.NODE_ENV === "production" ? baseOrigins : [...baseOrigins, ...devOrigins];

app.disable("x-powered-by");
app.use(express.json({ limit: "100kb" }));
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);
app.use((_, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  next();
});
app.use(clerkMiddleware()); // adds auth object to request

app.use("/api/inngest", serve({ client: inngest, functions }));
app.use("/api/chat", chatRoutes);
app.use("/api/sessions", sessionRoutes);

app.get("/health", (_, res) => {
  res.status(200).json({ msg: "success from api" });
});

app.use((error, _, res, next) => {
  if (error?.message === "Not allowed by CORS") {
    return res.status(403).json({ msg: "Blocked by CORS policy" });
  }

  return next(error);
});

const startServer = async () => {
  try {
    await connectDB();
    app.listen(ENV.PORT, () => {
      console.log(`Server listening on port ${ENV.PORT}`);
    });
  } catch (error) {
    console.error("Error starting the server, ", error);
  }
};

app.get("/", (req, res) => {
  res.send("Backend is running");
});

app.use((req, res) => {
  res.status(404).json({
    error: "Route not found",
    path: req.originalUrl,
  });
});

startServer();
