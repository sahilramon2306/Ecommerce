require("dotenv").config();

const express = require("express");
const path = require("path");
const fs = require("fs");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const session = require("express-session");
const { RedisStore } = require("connect-redis");
const { createClient } = require("redis");
const passport = require("./src/config/passport");
const database = require("./www/db/db");

const app = express();

/* ------------------ Redis Client ------------------ */
const redisClient = createClient({
  url: process.env.REDIS_URL || "redis://127.0.0.1:6379",
});
redisClient.on("error", (err) => console.error("Redis Client Error", err));
redisClient.connect().catch((err) =>
  console.error("Redis connection failed", err)
);

/* ------------------ CORS ------------------ */
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

/* ------------------ Session (Required for OAuth) ------------------ */
app.use(
  session({
    store: new RedisStore({ client: redisClient }),
    secret: process.env.SESSION_SECRET || "oauth_secret_key",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 24 * 60 * 60 * 1000,
    },
  })
);

app.use(passport.initialize());

/* ------------------ Razorpay Webhook (RAW body) ------------------ */
app.use(
  "/api/payment/razorpay/webhook",
  express.raw({ type: "application/json" })
);

/* ------------------ Body Parsers ------------------ */
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

/* ------------------ Cookie Parser ------------------ */
app.use(cookieParser());

/* ------------------ Static Files ------------------ */
app.use("/uploads", express.static(path.join(__dirname, "src/uploads")));
app.use("/invoices", express.static(path.join(__dirname, "src/invoices")));

/* =========================================================
   GOOGLE AUTH ROUTES
========================================================= */

app.get(
  "/auth/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
  })
);

app.get(
  "/auth/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: "http://localhost:5173/login",
  }),
  (req, res) => {
    const token = req.user.token;

    res.redirect(
      `http://localhost:5173/oauth-success?token=${token}`
    );
  }
);

/* ------------------ Auto-load Routes ------------------ */
const routesPath = path.join(__dirname, "src/routes");

fs.readdirSync(routesPath).forEach((file) => {
  if (file.endsWith(".js")) {
    const route = require(path.join(routesPath, file));
    if (typeof route.setRouter === "function") {
      route.setRouter(app);
    }
  }
});

/* ------------------ Health Check ------------------ */
const PORT = Number(process.env.PORT) || 5000;

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Backend running",
    port: PORT,
  });
});

app.get("/test", (req, res) => {
  res.json({
    port: PORT,
    pid: process.pid,
  });
});

app.get("/session-test", (req, res) => {
  req.session.testValue = "redis-session-ok";
  res.json({ ok: true, sessionID: req.sessionID });
});
/* ------------------ 404 Handler ------------------ */
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "API endpoint not found",
  });
});

/* ------------------ Start DB ------------------ */
database.startDB();

/* ------------------ Start Server ------------------ */
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
