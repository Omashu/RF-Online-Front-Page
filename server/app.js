import Koa from 'koa'
import Promise from 'bluebird'

import view from './view'
import news from './news'

import logger from './logger'
import parser from './parser'
import config from 'config'

const app = new Koa();

app.use(require("koa-static")("./public"))

app.use(async ctx => {
  const html = view.render("index", {
    news: news.getAll()
  })

  ctx.body = html
})

app.listen(config.get('server.port'), config.get("server.host"), () => {
  logger.info(`Listen on ${config.get('server.port')}`)
  parser()
}).on("error", (err) => {
  logger.fatal('Listen failed', err)
})