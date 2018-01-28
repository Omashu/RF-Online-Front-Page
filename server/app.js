import Koa from 'koa'
import Router from 'koa-router'
import Promise from 'bluebird'

import view from './view'
import news from './news'

import logger from './logger'
import parser from './parser'
import config from 'config'

const app = new Koa();
const router = new Router()

router.get("/", (ctx, next) => {
  ctx.body = view.render("index", {
    news: news.getAll()
  })
})

app
  .use(require("koa-static")("./public"))
  .use(router.routes())
  .use(router.allowedMethods())

app.listen(config.get('server.port'), config.get("server.host"), () => {
  logger.info(`Listen on ${config.get('server.port')}`)
  parser()
}).on("error", (err) => {
  logger.fatal('Listen failed', err)
})