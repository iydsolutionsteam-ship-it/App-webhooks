import express from "express";
import dotenv from "dotenv";
import requestId from "express-request-id";
import { notFound, errorHandler } from "./middleware/errorMiddleware.js";
import { requestLogger } from "./middleware/requestLogger.js";
import { handlePaystackWebhook } from "./controllers/paystackWebhook.js";
import connectDB from "./config/db.js";

import psrTestSchema from "./models/PsrTestUser.js";
import eduTestSchema from "./models/EduTestUser.js";

dotenv.config();
const app = express();

app.use(requestId());

// Middleware to parse JSON and keep raw body for signature verification
app.use(
  express.json({
    verify: (req, res, buf) => {
      req.rawBody = buf.toString();
    },
  })
);

// Health check routes
app.get("/", (req, res) => res.json({ message: "API is running..." }));
app.get("/ping", (req, res) =>
  res.status(200).json({
    status: "success",
    message: "Webhook server is alive 🚀",
    timestamp: new Date().toISOString(),
  })
);

let PsrTestUser, EduTestUser; // placeholders for models

// Start server
const startServer = async () => {
  try {
    // Create separate connections
    const psrDb = connectDB("PSR Test", process.env.PSRTEST_MONGO_URI);
    const eduDb = connectDB("Edu Test", process.env.EDUTEST_MONGO_URI);

    // Wait for connections to establish
    await psrDb.asPromise();
    await eduDb.asPromise();

    // Bind models to connections
    PsrTestUser = psrDb.model("PsrTest_User", psrTestSchema);
    EduTestUser = eduDb.model("Edutest_User", eduTestSchema);

    console.log("✅ Both databases connected successfully.");

    // Pass models to webhook via locals
    app.locals.PsrTestUser = PsrTestUser;
    app.locals.EduTestUser = EduTestUser;

    const PORT = process.env.PORT || 5002;
    app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
  } catch (err) {
    console.error("❌ Failed to connect to databases:", err.message);
    process.exit(1);
  }
};

// Pass models to webhook controller using middleware
app.use((req, res, next) => {
  req.PsrTestUser = app.locals.PsrTestUser;
  req.EduTestUser = app.locals.EduTestUser;
  next();
});

// Webhook route
app.use("/api/paystack/webhooks", requestLogger, handlePaystackWebhook);

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

startServer();
