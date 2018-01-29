import Router from 'koa-router'
import view from './utils/view'
import news from './reps/news'
import serverState from './reps/serverState'

export default () => {
  const router = new Router()

  router.get("/", (ctx, next) => {
    ctx.body = view.render("index", {
      news: news.getAll(),
      serverState: serverState.current()
    })
  })

  return router
}