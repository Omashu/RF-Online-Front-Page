import log4js from 'log4js'
import config from 'config'

const defaultAppenders = [
  "everything",
]

const errorAppenders = [
  "everything", "error"
]

if (process.env.NODE_ENV !== "test") {
  defaultAppenders.push("console");
  errorAppenders.push("console");
}

log4js.configure({
  appenders: {
    console: {
      type: "console"
    },
    everything: {
      type: "file",
      filename: "logs/everything.log",
      maxLogSize: 10485760,
      backups: 7
    },
    error: {
      type: 'file',
      filename: 'logs/error.log',
      maxLogSize: 10485760,
      backups: 7
    }
  },
  categories: {
    default: {
      appenders: defaultAppenders,
      level: 'info'
    },
    error: {
      appenders: errorAppenders,
      level: 'error'
    },
    debug: {
      appenders: ["console"],
      level: "debug"
    }
  }
})

const getLogger = function(category) {
  const logger = log4js.getLogger(category)
  logger.level = config.get("logger.level")
  return logger
}

const Logger = (function() {
  this.prefix = null
  this.combineArgs = (args) => {
    return this.prefix
      ? [this.prefix, ...args] : args
  }
  this.setPrefix = (value) => {
    this.prefix = value;
    return this;
  }

  this.info = function(...args) {
    getLogger().info.apply(getLogger(), this.combineArgs(args))
    return this;
  }

  this.trace = function(...args) {
    getLogger("debug").trace.apply(getLogger("debug"), this.combineArgs(args))
    return this;
  }

  this.debug = function(...args) {
    getLogger("debug").debug.apply(getLogger("debug"), this.combineArgs(args))
    return this;
  }

  this.error = function(...args) {
    getLogger("error").error.apply(getLogger("error"), this.combineArgs(args))
    return this;
  }

  this.fatal = function(...args) {
    getLogger("error").fatal.apply(getLogger("error"), this.combineArgs(args))
    return this;
  }

  return this;
});

const LoggerDefault = new Logger

export default LoggerDefault

export const createLogger = (prefix) => {
  return (new Logger)
    .setPrefix(prefix)
}