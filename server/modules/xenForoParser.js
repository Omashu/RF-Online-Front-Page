import { isFinite, compact } from 'lodash';
import Promise from 'bluebird';
import rp from 'request-promise';
import { purifyHtml, purifyText } from '../utils/dompurify';

export default module.exports = function Init({ logger, options }) {
  this.timeout = undefined;
  this.tm = isFinite(options.tm) ? options.tm : 60 * 30;
  this.limit = isFinite(options.limit) ? options.limit : 10;
  this.parsePoster = !!options.parsePoster;
  this.baseUrl = options.baseUrl;
  this.sectionUrl = options.sectionUrl;
  this.storageData = [];

  this.dispatchToView = () => ({ news: this.storageData });

  this.fetchBody = () => {
    logger.info('Trying to load the body by reference: %s', this.sectionUrl);
    return rp(this.sectionUrl);
  };

  this.parseBody = async (body) => {
    logger.info('Trying to parse body, content length: %d', body.length);
    const matches = body.match(/<li.+?discussionListItem.+?".+?>([\s\S]+?)<\/li>/g);

    if (!matches || matches.length <= 0) {
      logger.info('No items found');
      return this;
    }

    const usageCount = matches.length < this.limit ? matches.length : this.limit;

    logger.info('Founded %d items, usage %d', matches.length, usageCount);

    const listItems = matches.splice(0, usageCount);

    logger.info('Supplement Information');

    const news = await Promise.mapSeries(listItems, async (listItem) => {
      const data = listItem.match(/<h3.+?title[\s\S]+?>[\s\S]+?<a\shref="(.+?)"[\s\S]+class="PreviewTooltip"[\s\S]+?>(.*?)<\/a>[\s\S]+?DateTime[\s\S]+?>(.+?)<\//);

      const buildUrl = `${this.baseUrl}${data[1]}`;

      const itemData = {
        title: purifyText(data[2]),
        date: purifyText(data[3]),
        index: data.index,
        url: buildUrl,
        content: '',
        poster: null
      };

      try {
        logger.info('Try loading more info from %s', itemData.url);
        const itemBody = await rp(itemData.url);
        logger.info('Loaded, content size: %d', itemBody.length);

        const match = itemBody.match(/messageList[\s\S]+?messageContent">[\s\S]+?<article>([\s\S]+?)<\/article[\s\S]+?<\/div>/);

        if (!match) {
          return itemData;
        }

        const valid = purifyHtml(match[1]);
        itemData.content = purifyText(valid).substring(0, 200);

        // find first image
        if (this.parsePoster) {
          const matchImage = valid.match(/img.+?src=('|")(.+?)('|")/);

          if (matchImage && matchImage.length) {
            itemData.poster = purifyText(matchImage[2]);
          }
        }

        return itemData;
      } catch (err) {
        logger.error('Failed loading more info by %s: %s', itemData.url, err.message);
        logger.error(err.stack);
        return null;
      }
    });

    const results = compact(news)
      .sort((lft, rgt) => lft.index - rgt.index);

    return results;
  };

  this.clearStorageData = () => {
    logger.info('Clear storage data');
    this.storageData = [];
    return this;
  };

  this.appendToStorageData = (news) => {
    const append = news instanceof Array ? news : [news];
    this.storageData = [
      ...this.storageData,
      ...append
    ];

    return this;
  };

  this.tick = async () => {
    logger.info('Tick...');

    this.clearStorageData();

    const body = await this.fetchBody();
    const news = await this.parseBody(body);

    this.appendToStorageData(news);

    logger.info('End by success, parsed: %d, total: %d', news.length, this.storageData.length);
  };

  this.createProcess = () => {
    logger.info('Create Process...');

    if (this.timeout) {
      clearTimeout(this.timeout);
    }

    this.timeout = setTimeout(async () => {
      await this.tick();
      this.createProcess();
    }, this.tm * 1000);

    logger.info('Process Created! Next tick through %d seconds', this.tm);
  };

  this.createProcess();

  setTimeout(this.tick.bind(this), 15 * 1000);
  logger.info('First tick through %d seconds', 15);

  return this;
};
