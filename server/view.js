import pug from 'pug'
import config from 'config'
import packagejson from '../package.json'

const assetBuild = (asset, min = true) => {
  var url = config.get('app.url') + '/build/';
  if (min && process.env.NODE_ENV === "production")
    url += asset.replace(/^(.+)(\.(css|js))$/, '$1.min$2');
  else url += asset;
  url += "?"+packagejson.version;
  return url;
}

export const render = (view, options = {}) => {
  return pug.renderFile(`./server/views/${view}.pug`, {
    title: config.get("app.title"),
    brand: config.get("app.title"),
    navigation: config.get("app.navigation"),
    startUrl: config.get("app.startUrl"),
    url: config.get("app.url"),
    assetBuild,
    ...options
  })
}

export default {
  render
}