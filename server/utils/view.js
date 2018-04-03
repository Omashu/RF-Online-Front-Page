import { get } from 'lodash';
import pug from 'pug';
import config from 'config';
import cx from 'classnames';
import path from 'path';
import packagejson from '../../package.json';
import { modules } from '../index';

const assetBuild = (asset, min = true) => {
  let url = `${config.get('app.url')}/build/`;

  if (min && process.env.NODE_ENV === 'production') {
    url += asset.replace(/^(.+)(\.(css|js))$/, '$1.min$2');
  } else {
    url += asset;
  }

  url += `?${packagejson.version}`;
  return url;
};

export const render = (view, options = {}) => pug.renderFile(
  path.resolve(__dirname, '../views', `${view}.pug`),
  {
    news: [],
    serverState: { players: {} },
    title: config.get('app.title'),
    brand: config.get('app.brand'),
    navigation: config.get('app.navigation'),
    startUrl: config.get('app.startUrl'),
    url: config.get('app.url'),
    getModule: (keys, defaultReturn = null) => {
      const [name, ...valueKeys] = keys.split('.');
      if (!modules[name]) {
        return defaultReturn;
      }

      const values = modules[name].dispatchToView();
      return get(values, valueKeys, defaultReturn);
    },
    cx,
    assetBuild,
    ...options
  }
);

export default {
  render
};
