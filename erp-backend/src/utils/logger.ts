import winston from "winston";

const isProd = process.env.NODE_ENV === "production";

export const logger = winston.createLogger({
  level: isProd ? "info" : "debug",
  format: winston.format.combine(
    winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    winston.format.errors({ stack: true }),
    isProd
      ? winston.format.json()
      : winston.format.combine(
          winston.format.colorize(),
          winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
            const err = (meta as any).err;
            const errDetail = err
              ? `\n  -> ${err.message || err}${err.stack ? `\n${err.stack}` : ""}`
              : Object.keys(meta).length
              ? `\n  -> ${JSON.stringify(meta)}`
              : "";
            return `${timestamp} [${level}] ${stack || message}${errDetail}`;
          })
        )
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: "logs/error.log", level: "error" }),
    new winston.transports.File({ filename: "logs/combined.log" }),
  ],
});

// Stream adapter so morgan's HTTP request logs flow through winston too.
export const morganStream = {
  write: (message: string) => logger.info(message.trim()),
};
