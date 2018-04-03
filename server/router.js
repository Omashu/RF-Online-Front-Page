import Router from 'koa-router';
import homeController from './http/home';

const router = new Router();
router.get('/', homeController);
export default router;
