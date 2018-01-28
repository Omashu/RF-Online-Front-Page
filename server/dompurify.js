import { JSDOM } from 'jsdom';
import createDOMPurify from 'dompurify';

const app = (new JSDOM('')).window;
const dompurify = createDOMPurify(app);

/**
 * purify Html
 * @param  {string} value dirty string to purify
 * @param  {object} props additional dompurify settings see: 
 * @return {string} clean html
 */
export const purify = (value, props) => {
  return dompurify.sanitize(value, props);
}

/**
 * purify Text
 * @param  {string} value dirty string to purify
 * @return {string} clean text
 */
export const purifyText = (value) => {
  return purify(value, {ALLOWED_TAGS : ["#text"]});
}

/**
 * purify Html
 * @param  {string} value dirty string to purify
 * @return {string} clean html (allow attr controls)
 */
export const purifyHtml = (value) => {
  return purify(value, {ADD_TAGS : ["picture"], USE_PROFILES : {html: true}, ADD_ATTR : ["controls", "srcset"]});
}

export default purify;