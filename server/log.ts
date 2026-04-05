const winston = require("winston");
require("winston-daily-rotate-file");

const { combine, timestamp, printf, splat } = winston.format;

const logFormat = printf(({ level, message, timestamp }) => {
    return `${timestamp} [${level}]: ${message}`;
});

const rotate = new winston.transports.DailyRotateFile({
    filename: __dirname + "/logs/jigoku-%DATE%.log",
    datePattern: "YYYY-MM-DD",
    zippedArchive: true,
    maxSize: "20m",
    maxFiles: "14d"
});

const logLevel = process.env.LOG_LEVEL || (process.env.NODE_ENV === "production" ? "info" : "debug");

const logger = winston.createLogger({
    level: logLevel,
    format: combine(
        splat(),
        timestamp(),
        logFormat
    ),
    transports: [
        new winston.transports.Console(),
        rotate
    ]
});

module.exports = logger;
