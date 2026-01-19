import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.printf((info) => {
      return `[${info.timestamp}] ${info.level.toUpperCase()}: ${info.message} ${info.stack ? '\n' + info.stack : ''}`;
    })
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf((info) => {
          return `[${info.timestamp}] ${info.level}: ${info.message}`;
        })
      )
    })
  ]
});



export default logger;

