import Koa from 'koa';
import KoaStatic from 'koa-static';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { forEach } from 'lodash';
import config from 'config';
import socket from 'socket.io';
import router from './router';
import logger, { createLoggerModule } from './utils/logger';

export const app = new Koa();
export const server = http.createServer(app.callback());
export const io = socket(server);

app.use(KoaStatic('./public'))
  .use(router.routes())
  .use(router.allowedMethods());

const PORT = process.env.PORT || config.get('server.port');
const HOST = process.env.HOST || config.get('server.host');

const confModules = config.get('modules');
export const modules = {};

forEach(confModules, (moduleValues, moduleName) => {
  if (!moduleValues.active) {
    return;
  }

  logger.info(`Initialize module ${moduleName}`);
  const loggerInstance = createLoggerModule(moduleName);
  const modulePath = path.resolve(__dirname, './modules', `${moduleName}.js`);

  try {
    fs.statSync(modulePath);
    const Module = require(`./modules/${moduleName}`);

    const emit = (to, eventName, eventPayload) => {
      const fullName = [moduleName, eventName].join('.');
      logger.debug('Socket emit %s', fullName, eventPayload);
      to.emit(fullName, eventPayload);
    };

    modules[moduleName] = new Module({
      logger: loggerInstance,
      socket: {
        emit: emit.bind(null, io),
        wrapClient: (socketClient) => ({
          emit: emit.bind(null, socketClient)
        }),
        instance: io,
      },
      options: moduleValues
    });

    logger.info(`Module ${moduleName} initialized!`);
  } catch (err) {
    logger
      .error(`Failed initialize module ${moduleName} %s`, err.message)
      .error(err.stack);
  }
});

server.listen(PORT, HOST, () => {
  logger.info('Listen on %s:%d', HOST, PORT);
}).on('error', (err) => {
  logger
    .error('Listen failed: %s', err.message)
    .error(err.stack);
});
