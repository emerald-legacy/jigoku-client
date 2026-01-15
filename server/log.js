const winston = require('winston');
require('winston-daily-rotate-file');

const { combine, timestamp, printf } = winston.format;

const logFormat = printf(({ level, message, timestamp }) => {
    return `${timestamp} [${level}]: ${message}`;
});

const rotate = new winston.transports.DailyRotateFile({
    filename: __dirname + '/logs/ringteki-%DATE%.log',
    datePattern: 'YYYY-MM-DD',
    zippedArchive: true,
    maxSize: '20m',
    maxFiles: '14d'
});

const logger = winston.createLogger({
    format: combine(
        timestamp(),
        logFormat
    ),
    transports: [
        new winston.transports.Console(),
        rotate
    ]
});

module.exports = logger;
