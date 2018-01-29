import Koa from 'koa'
import Router from 'koa-router'
import Promise from 'bluebird'
import http from 'http'
import config from 'config'
import _ from 'lodash'

import news from './reps/news'
import view from './utils/view'
import logger from './utils/logger'
import modules from './modules'
import routes from './routes'

import { ServerStateEmitter } from './events'

export const app = new Koa();
export const server = http.createServer(app.callback())
export const io = require('socket.io')(server);

const defaultRoutes = routes()

app.use(require("koa-static")("./public"))
.use(defaultRoutes.routes())
.use(defaultRoutes.allowedMethods())

_.forEach(modules, (methods, name) => {
  const modulesConfig = config.get(`modules`)

  if (!modulesConfig[name] || typeof modulesConfig[name] !== "object"
    || !modulesConfig[name].active)
    return

  methods.initialize()
});

server.listen(config.get('server.port'), config.get("server.host"), () => {
  logger.info(`Listen on ${config.get('server.port')}`)
}).on("error", (err) => {
  logger.fatal('Listen failed', err)
})