// utils/logger.js
import { createLogger, format, transports } from "winston";
import path from "path";
import { fileURLToPath } from "url";
import chalk from "chalk";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const logFile = path.join(__dirname, "../../../logs/app.log");

// Fields we explicitly allow to be logged in console
const allowedMetaFields = ["method", "url", "user", "statusCode"];

const consoleFormat = format.printf(({ level, message, timestamp, requestId, ...meta }) => {
  const shortReqId = requestId ? requestId.slice(0, 6) : null;

  // Filter meta to avoid logging things like request body
  const filteredMeta = Object.fromEntries(
    Object.entries(meta).filter(([key]) => allowedMetaFields.includes(key))
  );

  // Special case: HTTP request logs → [METHOD] /url
  let requestMeta = "";
  if (filteredMeta.method && filteredMeta.url) {
    requestMeta = `${chalk.magenta(`[${filteredMeta.method}]`)} ${chalk.blue(filteredMeta.url)}`;
    delete filteredMeta.method;
    delete filteredMeta.url;
  }

  // Show user email if present (from req.user)
  const userMeta = filteredMeta.user ? chalk.green(`(user: ${filteredMeta.user})`) : "";
  if (filteredMeta.user) delete filteredMeta.user;

  // Show status code if present
  const statusMeta = filteredMeta.statusCode ? chalk.yellow(`→ ${filteredMeta.statusCode}`) : "";
  if (filteredMeta.statusCode) delete filteredMeta.statusCode;

  return (
    `\n${chalk.gray(`[${timestamp}]`)} ` +
    `${chalk.bold(level.toUpperCase())} ` +
    (shortReqId ? `${chalk.cyan(`[req:${shortReqId}]`)} ` : "") +
    (requestMeta ? requestMeta : chalk.white(message)) +
    (userMeta ? " " + userMeta : "") +
    (statusMeta ? " " + statusMeta : "") +
    `\n`
  );
});

export const logger = createLogger({
  level: "info",
  format: format.combine(
    format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    format.errors({ stack: true })
  ),
  transports: [
    new transports.Console({ format: consoleFormat }),
    new transports.File({
      filename: logFile,
      maxsize: 10_000_000,
      maxFiles: 5,
      format: format.combine(format.timestamp(), format.json())
    })
  ],
});
