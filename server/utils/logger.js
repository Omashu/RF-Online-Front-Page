import winston from 'winston';
import config from 'config';

const defaultTransports = [
  new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
  new winston.transports.File({ filename: 'logs/combined.log' })
];

const defaultFormat = winston.format.combine(
  winston.format.splat(),
  winston.format.simple()
);

function createLogger(props = {}) {
  const transports = props.transports instanceof Array
    ? props.transports : defaultTransports;

  const format = props.format !== undefined
    ? props.format : defaultFormat;

  const logger = winston.createLogger({
    level: config.get('logger.level'),
    format,
    transports
  });

  if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.splat(),
        winston.format.simple()
      ),
      level: 'debug',
      colorize: true
    }));
  }

  return logger;
}

export default createLogger();

export function createLoggerModule(moduleName) {
  const logger = createLogger();
  logger.add(new winston.transports.File({ filename: `logs/modules/${moduleName}.log`, level: 'error' }));
  return logger;
}
