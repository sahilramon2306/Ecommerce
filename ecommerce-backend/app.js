const express = require("express");
const path = require("path");
const fs = require("fs");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const database = require("./www/db/db");

const app = express();

/* ------------------ CORS (VERY IMPORTANT) ------------------ */
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

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
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Backend running",
  });
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
const PORT = 5000;
app.listen(PORT, () => {
  console.log("🚀 Server running on port", PORT);
});
