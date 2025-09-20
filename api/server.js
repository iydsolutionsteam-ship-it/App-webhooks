import express from "express";
import dotenv from "dotenv";
import requestId from "express-request-id";
import connectDB from "./config/db.js";
import { notFound, errorHandler } from "./middleware/errorMiddleware.js";
import { requestLogger } from "./middleware/requestLogger.js";
import { handlePaystackWebhook } from "./controllers/paystackWebhook.js";

dotenv.config();

const app = express();

const psrDb = connectDB("PSR Test", process.env.PSRTEST_MONGO_URI);
const edutestDb = connectDB("Edu Test", process.env.EDUTEST_MONGO_URI);

app.use(requestId());

// Middleware to parse JSON and keep raw body for signature verification
app.use(
  express.json({
    verify: (req, res, buf) => {
      req.rawBody = buf.toString(); // store raw body
    },
  })
);

// Routes
app.get("/", (req, res) => {
  res.json({ message: "API is running..." });
});

app.get("/ping", (req, res) => {
  res.status(200).json({
    status: "success",
    message: "Webhook server is alive 🚀",
    timestamp: new Date().toISOString(),
  });
});

// Webhook route
app.use("/api/paystack/webhooks", requestLogger, handlePaystackWebhook);

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

// Server start
const PORT = process.env.PORT || 5002;
app.listen(PORT, () =>
  console.log(`Server running on http://localhost:${PORT}`)
);
