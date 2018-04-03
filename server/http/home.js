import { render } from '../utils/view';
import logger from '../utils/logger';

export default async (ctx, next) => {
  try {
    ctx.body = render('index', {});
  } catch (err) {
    logger.error(err.stack);
    return next(err);
  }
};
