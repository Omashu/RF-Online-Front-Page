import _ from 'lodash'
import Promise from 'bluebird'
import rp from 'request-promise'
import config from 'config'
import url from 'url'
import logger from './logger'
import news from './news'
import { purifyHtml, purifyText } from './dompurify'

const GetBody = () => {
  logger.debug(`Try to load external body data...`)

  return rp(config.get("parser.sectionUrl"))
  .then(body => {
    logger.debug(`External body loaded`)
    return body
  })
  .catch(err => {
    logger.debug(`Failed on load external body data`)
    throw err
  })
}

const ParseBody = (body) => {
  logger.debug(`Try to parse body content...`)
  const listItems = body.match(/<li.+?discussionListItem.+?".+?>([\s\S]+?)<\/li>/g)

  if (!listItems) {
    const err = new Error(`No Items Found`)
    logger.debug(err.message)
    return Promise.reject(err)
  }

  logger.debug(`Founded ${listItems.length} items`)
  logger.debug(`Supplement Information (in parallel mode)`)

  const promises = _.map(listItems, (listItem, index) => {
    return new Promise((resolve, reject) => {
      if (!listItem)
        return resolve(null)

      const data = listItem
      .match(/<h3.+?title[\s\S]+?>[\s\S]+?<a\shref="(.+?)"[\s\S]+class="PreviewTooltip"[\s\S]+?>(.*?)<\/a>[\s\S]+?DateTime[\s\S]+?>(.+?)<\//)

      if (!data)
        return resolve(null)

      const [ match, url, title, date ] = data

      return resolve({
        url,
        title,
        date,
        index
      })
    })
    .then(data => {
      const buildUrl = `${config.get("parser.baseUrl")}${data.url}`
      return {...data, url: buildUrl}
    })
    .then(data => {
      logger.debug(`Get`, data)
      return new Promise((resolve, reject) => {
        rp(data.url)
          .then(body => {
            logger.debug(`Responsed`, data)
            resolve([data, body])
          })
          .catch(err => {
            logger.debug(`Error`, data, err)
            resolve([data, null]) // skip
          })
      })
    })
    .spread((data, body) => {
      if (!body) {
        logger.debug(data.title, `- skipped`)
        return null
      }

      const match = body.match(/messageList[\s\S]+?messageContent">[\s\S]+?<article>([\s\S]+?)<\/article[\s\S]+?<\/div>/)

      if (!match)
        return {...data, content: ""}

      return {...data, content: purifyText(match[1] || "").substring(0, 200)}
    })
  })

  return Promise.all(promises)
  .then(results => {
    return _.compact(results)
    .sort((lft, rgt) => {
      return lft.index - rgt.index
    })
  })
}

const CreateTimer = () => {
  setTimeout(Process, config.get("parser.tm") * 1000)
}

const Process = () => {
  logger.info(`The parser process now started...`)

  GetBody()
  .then(body => {
    return ParseBody(body)
  })
  .then(newNews => {
    news.reset()
    _.forEach(newNews, data => news.append(data))
    return news.getAll()
  })
  .then(newNews => {
    logger.info(`The parser process end by success, total collected news ${newNews.length}`)
    logger.info(`Again through ${config.get("parser.tm")} seconds`)
    CreateTimer()
  })
  .catch(err => {
    logger.error(`The parser process end by error`, err)
    logger.info(`Should try again through ${config.get("parser.tm")} seconds`)
    CreateTimer()
  })
}

export default Process