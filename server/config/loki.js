const winston = require("winston");
const loki = require("winston-loki");
require("winston-daily-rotate-file");
require("dotenv").config();
const { combine, timestamp, printf, colorize, align, json } = winston.format;
let lokiUrl = "http://localhost:3100";

const logLevels = {
  fatal: 0,
  error: 1,
  warn: 2,
  info: 3,
  debug: 4,
  trace: 5,
};
var log;

log = winston.createLogger({
  transports: [
    new loki({
      host: lokiUrl,
      labels: { app: "lrtjabotopup" },
      handleExceptions: true,
      handleRejections: true,
      clearOnError: true,
      json: true,
      format: json(),
      replaceTimestamp: true,
      onConnectionError: (err) => console.log(`Loki error ${err}`),
    }),
    new winston.transports.Console({
      format: combine(colorize()),
    }),
  ],
});

log.add(
  new winston.transports.Console({
    format: winston.format.cli(),
    format: combine(
      colorize({ all: true }),
      timestamp({
        format: "YYYY-MM-DD HH:mm:ss.SSS",
      }),
      align(),
      printf((info) => `[${info.timestamp}] ${info.level}: ${info.message}`)
    ),
  })
);
module.exports = {
  log,
};
