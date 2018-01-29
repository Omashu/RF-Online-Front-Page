import _ from 'lodash'
import Promise from 'bluebird'
import rp from 'request-promise'
import config from 'config'
import url from 'url'

import { createLogger } from '../utils/logger'
import { purifyHtml, purifyText } from '../utils/dompurify'

import news from '../reps/news'

const sectionUrl = config.get(`modules.xenForoNewsParser.sectionUrl`)
const baseUrl = config.get(`modules.xenForoNewsParser.baseUrl`)
const tm = config.get(`modules.xenForoNewsParser.tm`)
const limit = config.get(`modules.xenForoNewsParser.limit`)
const logger = createLogger("Module `xenForoNewsParser`")

const GetBody = () => {
  logger.debug(`Try to load external body data...`)

  return rp(sectionUrl)
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
  const matches = body.match(/<li.+?discussionListItem.+?".+?>([\s\S]+?)<\/li>/g)

  if (!matches) {
    const err = new Error(`No Items Found`)
    logger.debug(err.message)
    return Promise.reject(err)
  }

  const usageCount = matches.length < limit ? matches.length : limit
  logger.debug(`Founded ${matches.length} items, usage ${usageCount}`)

  const listItems = matches.splice(0, usageCount)

  logger.debug(`Supplement Information (in parallel mode)`)

  const promises = _.map(listItems, (listItem, index) => {
    return new Promise((resolve, reject) => {
      const data = listItem
      .match(/<h3.+?title[\s\S]+?>[\s\S]+?<a\shref="(.+?)"[\s\S]+class="PreviewTooltip"[\s\S]+?>(.*?)<\/a>[\s\S]+?DateTime[\s\S]+?>(.+?)<\//)
      const [ match, url, title, date ] = data

      return resolve({
        url,
        title,
        date,
        index
      })
    })
    .then(data => {
      const buildUrl = `${baseUrl}${data.url}`
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

      const parsedData = {
        content: "",
        poster: null
      }

      const match = body.match(/messageList[\s\S]+?messageContent">[\s\S]+?<article>([\s\S]+?)<\/article[\s\S]+?<\/div>/)

      if (!match) {
        return {...data, ...parsedData}
      }

      const purified = purifyHtml(match[1] || "");
      parsedData.content = purifyText(purified).substring(0, 200)

      // find first image
      const matchImage = purified.match(/img.+?src=('|")(.+?)('|")/)

      if (matchImage && matchImage.length) {
        parsedData.poster = purifyText(matchImage[2])
      }

      return {...data, ...parsedData}
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
  setTimeout(Process, tm * 1000)
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
    logger.info(`Again through ${tm} seconds`)
    CreateTimer()
  })
  .catch(err => {
    logger.error(`The parser process end by error`, err)
    logger.info(`Should try again through ${tm} seconds`)
    CreateTimer()
  })
}

export const initialize = () => {
  logger.info(`Initialized`)
  Process()
}

export default {
  initialize
}