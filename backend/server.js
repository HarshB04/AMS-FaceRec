require("dotenv").config();
const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const rateLimit = require("express-rate-limit");

const authRoutes = require("./routes/authRoutes");
const studentRoutes = require("./routes/studentRoutes");
const registrationRoutes = require("./routes/registrationRoutes");
const approvalRoutes = require("./routes/approvalRoutes");
const attendanceRoutes = require("./routes/attendanceRoutes");
const faceRoutes = require("./routes/faceRoutes");
const instructorRoutes = require("./routes/instructorRoutes");

const app = express();
const PORT = process.env.PORT || 5000;

// ── Security Middleware ───────────────────────────────────────────────────────

// Helmet — sets security-related HTTP headers
app.use(helmet());

// CORS — allow requests from the frontend origin only
const allowedOrigins = [
  process.env.FRONTEND_URL || "http://localhost:5173",
  "http://localhost:5174", // common Vite fallback port
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g., curl, Postman) in development
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS: origin '${origin}' is not allowed.`));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

// JSON body parsing (limit 1MB to prevent payload attacks)
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

// Global rate limiter — 1000 requests per 15 minutes per IP (increased for testing)
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too Many Requests", message: "Please slow down and try again later." },
});
app.use(globalLimiter);

// Tighter rate limiter for auth endpoints — 100 attempts per 15 minutes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too Many Requests", message: "Too many login attempts. Please wait 15 minutes." },
});

// ── Routes ────────────────────────────────────────────────────────────────────

app.get("/", (req, res) => {
  res.json({
    service: "AMS-FaceRec Backend API",
    version: "1.0.0",
    status: "running",
    endpoints: {
      auth: [
        "POST /api/auth/admin/login",
        "POST /api/auth/teacher/login",
        "POST /api/auth/student/login",
        "POST /api/auth/register      (public — student self-registration)",
        "GET  /api/auth/me",
      ],
      students: [
        "POST   /api/students/register  (admin)",
        "GET    /api/students/profile   (student)",
        "GET    /api/students/all       (admin)",
        "PUT    /api/students/:id       (admin)",
        "DELETE /api/students/:id       (admin)",
      ],
      admin: [
        "GET  /api/admin/pending-users           (admin)",
        "GET  /api/admin/all-registration-users  (admin)",
        "POST /api/admin/approve/:id             (admin)",
        "POST /api/admin/reject/:id              (admin)",
      ],
      attendance: [
        "POST /api/attendance/log   (internal — Python face engine only, protected by X-Face-Engine-Secret)",
      ],
      face: [
        "POST /api/face/enroll-complete  (admin — call after webcam capture finishes)",
      ],
    },
  });
});

// Tighter rate limiter for public registration — 5 registrations per 15 minutes per IP
const registrationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too Many Requests", message: "Too many registration attempts. Please wait 15 minutes." },
});

app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/auth", registrationLimiter, registrationRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/admin", approvalRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/face", faceRoutes);
app.use("/api/instructors", instructorRoutes);

// ── 404 Handler ───────────────────────────────────────────────────────────────

app.use((req, res) => {
  res.status(404).json({ error: "Not Found", message: `Route '${req.method} ${req.path}' does not exist.` });
});

// ── Global Error Handler ──────────────────────────────────────────────────────

app.use((err, req, res, _next) => {
  console.error("[server] Unhandled error:", err);
  res.status(500).json({ error: "Internal Server Error", message: err.message || "Unexpected error." });
});

// ── Start ─────────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`\n🚀 AMS-FaceRec backend running on http://localhost:${PORT}`);
  console.log(`   Supabase URL: ${process.env.SUPABASE_URL || "(not set — check .env)"}`);
  console.log(`   Frontend allowed: ${allowedOrigins.join(", ")}\n`);
});

module.exports = app;
