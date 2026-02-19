import { createLogger, format, transports } from "winston";

const { combine, timestamp, printf, colorize, errors } = format;

const prod = process.env.NODE_ENV === "production";

const logFormat = printf(({ level, message, timestamp, stack }) => {
  return `${timestamp} ${level}: ${stack || message}`;
});

export const logger = createLogger({
  level: prod ? "info" : "debug",
  format: combine(errors({ stack: true }), timestamp(), logFormat),
  transports: [
    new transports.Console({
      format: prod ? format.simple() : combine(colorize(), logFormat),
    }),
  ],
});

export default logger;
