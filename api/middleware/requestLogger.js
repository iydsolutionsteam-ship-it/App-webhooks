// middleware/requestLogger.js
import { v4 as uuidv4 } from "uuid";
import { logger } from "../utils/logger.js";

export const requestLogger = (req, res, next) => {
  const requestId = uuidv4();
  req.requestId = requestId;

  logger.info(`[${requestId}] Incoming request`, {
    method: req.method,
    url: req.originalUrl,
    body: req.body,
    user: req.user?._id || "guest",
  });

  res.on("finish", () => {
    logger.info(`[${requestId}] Response sent`, {
      statusCode: res.statusCode,
    });
  });

  next();
};
