const winston = require('winston');
const stackTrace = require('stack-trace');

const {
  combine, timestamp, printf,
} = winston.format;

const myFormat = printf(({
  level,
  ...info
}) => JSON.stringify({
  log_level: level,
  ...info,
})+',');

const logger = winston.createLogger({
  level: 'debug',
  format: combine(
    timestamp(),
    myFormat,
  ),
  defaultMeta: {
    application: 'backend',
    application_stack: 'data-management',
    log_type: 'application',
  },
  transports: [
    new winston.transports.Console({
      format: winston.format.simple(),
      silent: process.env.env !== 'development',
      handleExceptions: true,
    }),
  ],
});

if (process.env.log_file) {
  logger.add(new winston.transports.File({
    filename: process.env.log_file,
    maxsize: 50 * 1024 * 1024,
    maxFiles: 2,
    handleExceptions: true,
  }));
}

function initGlobally() {
  const oldlog = console['log'];
  function redirectConsole(funcNames) {
    funcNames.forEach((funcName) => {
      console[funcName] = function (...args) {
        const trace = stackTrace.get();
        let message = args.toString();
        logger.log({
          message,
          level: funcName === 'log' ? 'info' : funcName,
          event_source: `${trace[1].getFileName()}:${trace[1].getLineNumber()}`,
        });
      };
    });
  }
  //redirectConsole(['log', 'error',  'debug', 'info']);
}

module.exports = {
  logger,
  initGlobally,
};
